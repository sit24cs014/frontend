package com.erevive.service;

import java.io.IOException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.erevive.api.ApiException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EReviveService {
    private static final Set<String> DEVICE_TYPES = Set.of(
            "mobile_phone", "laptop", "tablet", "desktop", "motherboard",
            "monitor", "keyboard", "mouse", "battery", "charger", "cables",
            "circuit_board", "other"
    );
    private static final Set<String> POWERS = Set.of("yes", "no", "not_sure");
    private static final Set<String> CONDITIONS = Set.of(
            "working_perfectly", "minor_issues", "major_damage", "not_working"
    );
    private static final Set<String> DAMAGES = Set.of(
            "no_damage", "cracked_screen", "damaged_body", "other_damage"
    );
    private static final Set<String> PREFERENCES = Set.of("reuse", "recycle");
    private static final Set<String> TIME_SLOTS = Set.of(
            "09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"
    );
    private static final Map<String, String> DEVICE_LABELS = Map.ofEntries(
            Map.entry("mobile_phone", "Mobile Phone"),
            Map.entry("laptop", "Laptop"),
            Map.entry("tablet", "Tablet"),
            Map.entry("desktop", "Desktop Computer"),
            Map.entry("motherboard", "Motherboard"),
            Map.entry("monitor", "Monitor"),
            Map.entry("keyboard", "Keyboard"),
            Map.entry("mouse", "Mouse"),
            Map.entry("battery", "Battery"),
            Map.entry("charger", "Charger / Adapter"),
            Map.entry("cables", "Electronic Cables"),
            Map.entry("circuit_board", "Circuit Board"),
            Map.entry("other", "Other Electronic Device")
    );

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public EReviveService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    public Long resolveUserId(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        if (!authorization.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "A valid session is required.");
        }
        try {
            return jdbc.queryForObject(
                    "SELECT user_id FROM auth_tokens WHERE token = ?",
                    Long.class,
                    authorization.substring("Bearer ".length()).trim()
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Your session has expired. Please log in again.");
        }
    }

    public Long requireUserId(String authorization) {
        Long userId = resolveUserId(authorization);
        if (userId == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Please log in to continue.");
        }
        return userId;
    }

    public Map<String, Object> submitSurvey(
            SurveyRequest request,
            MultipartFile image,
            Long userId
    ) throws IOException {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Assessment answers are required.");
        }
        Map<String, String> errors = new LinkedHashMap<>();
        validate(errors, "deviceType", request.deviceType(), DEVICE_TYPES);
        validate(errors, "powersOn", request.powersOn(), POWERS);
        validate(errors, "condition", request.condition(), CONDITIONS);
        validate(errors, "physicalDamage", request.physicalDamage(), DAMAGES);
        validate(errors, "preference", request.preference(), PREFERENCES);
        if (!errors.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please answer all questions.", errors);
        }

        if (image != null && !image.isEmpty()) {
            if (image.getSize() > 10L * 1024 * 1024) {
                throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "The image must be 10 MB or smaller.");
            }
            if (image.getContentType() == null
                    || !Set.of("image/jpeg", "image/png", "image/webp").contains(image.getContentType())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a JPG, PNG, or WEBP image.");
            }
        }

        if ("battery".equals(request.deviceType())
                && (!"no_damage".equals(request.physicalDamage())
                || "major_damage".equals(request.condition())
                || "not_working".equals(request.condition()))) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Damaged or unsafe batteries must be handled by an authorized battery recycling professional."
            );
        }

        int score = 0;
        if ("yes".equals(request.powersOn())) {
            score += 2;
        } else if ("no".equals(request.powersOn())) {
            score -= 3;
        }
        score += switch (request.condition()) {
            case "working_perfectly" -> 3;
            case "minor_issues" -> 1;
            case "major_damage" -> -3;
            default -> -4;
        };
        score += switch (request.physicalDamage()) {
            case "no_damage" -> 2;
            case "damaged_body" -> -2;
            default -> -1;
        };

        String recommendation = "recycle".equals(request.preference()) || score < 0
                ? "RECYCLE"
                : "REUSE";
        String reason = "REUSE".equals(recommendation)
                ? "This electronic item appears suitable for reuse or refurbishment after professional inspection."
                : "This electronic item is recommended for responsible recycling and material recovery.";
        Estimate estimate = estimate(
                request.deviceType(),
                request.condition(),
                request.physicalDamage(),
                recommendation
        );
        String id = newId("SV");
        Instant createdAt = Instant.now();
        byte[] imageBytes = image == null || image.isEmpty() ? null : image.getBytes();
        String contentType = imageBytes == null ? null : image.getContentType();

        jdbc.update(
                """
                INSERT INTO assessments (
                    id, user_id, device_type, powers_on, device_condition,
                    physical_damage, preference, recommendation, reason,
                    estimated_value_min, estimated_value_max, value_type,
                    estimated_weight_kg, waste_diverted_kg, co2_saved_kg,
                    recoverable_materials, image_data, image_content_type, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id,
                userId,
                request.deviceType(),
                request.powersOn(),
                request.condition(),
                request.physicalDamage(),
                request.preference(),
                recommendation,
                reason,
                estimate.valueMin(),
                estimate.valueMax(),
                estimate.valueType(),
                estimate.weightKg(),
                estimate.weightKg(),
                estimate.co2SavedKg(),
                String.join("|", estimate.materials()),
                imageBytes,
                contentType,
                Timestamp.from(createdAt)
        );
        return assessmentResponse(
                id, request.deviceType(), recommendation, reason, request.preference(),
                estimate, createdAt, imageBytes != null
        );
    }

    public Map<String, Object> getAnalysis(String id, Long userId) {
        String sql = "SELECT * FROM assessments WHERE id = ?" + ownerClause(userId);
        Object[] args = new Object[]{id, userId};
        return jdbc.query(sql, rs -> {
            if (!rs.next()) {
                throw notFound("Assessment not found.");
            }
            return assessmentResponse(rs);
        }, args);
    }

    public StoredImage getAnalysisImage(String id, Long userId) {
        String sql = "SELECT image_data, image_content_type FROM assessments WHERE id = ?"
                + (userId == null ? "" : " AND user_id = ?");
        Object[] args = userId == null ? new Object[]{id} : new Object[]{id, userId};
        return jdbc.query(sql, rs -> {
            if (!rs.next()) {
                throw notFound("Assessment image not found.");
            }
            byte[] bytes = rs.getBytes("image_data");
            if (bytes == null || bytes.length == 0) {
                throw notFound("No image was saved for this assessment.");
            }
            return new StoredImage(bytes, rs.getString("image_content_type"));
        }, args);
    }

    public Map<String, Object> getDashboard(Long userId) {
        List<Map<String, Object>> analyses = listAnalyses(userId);
        List<Map<String, Object>> pickups = listPickups(userId);
        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("ecoPoints", analyses.size() * 10 + pickups.size() * 25);
        dashboard.put("itemsAnalyzed", analyses.size());
        dashboard.put("pickupsBooked", pickups.size());
        dashboard.put("analyses", analyses);
        dashboard.put("pickups", pickups);
        return dashboard;
    }

    public Map<String, Object> schedulePickup(PickupRequest request, Long userId) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Pickup details are required.");
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String name = trim(request.fullName());
        String phone = trim(request.phone());
        String address = trim(request.address());
        String city = trim(request.city());
        String state = trim(request.state());
        String pinCode = trim(request.pinCode());

        if (name.length() < 2 || name.length() > 80) {
            errors.put("fullName", "Enter your full name.");
        }
        if (!phone.matches("^(\\+91[- ]?)?[6-9]\\d{9}$")) {
            errors.put("phone", "Enter a valid mobile number.");
        }
        if (address.isEmpty()) {
            errors.put("address", "Pickup address is required.");
        }
        if (city.isEmpty()) {
            errors.put("city", "City is required.");
        }
        if (state.isEmpty()) {
            errors.put("state", "State is required.");
        }
        if (!pinCode.matches("^[1-9]\\d{5}$")) {
            errors.put("pinCode", "Enter a valid PIN code.");
        }

        LocalDate pickupDate = null;
        try {
            pickupDate = LocalDate.parse(request.pickupDate());
            if (pickupDate.isBefore(LocalDate.now())) {
                errors.put("pickupDate", "Date cannot be in the past.");
            } else if (pickupDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
                errors.put("pickupDate", "Sunday pickups are unavailable.");
            }
        } catch (Exception exception) {
            errors.put("pickupDate", "Select a valid date.");
        }
        if (request.timeSlot() == null || !TIME_SLOTS.contains(request.timeSlot())) {
            errors.put("timeSlot", "Select a valid time slot.");
        }
        if (request.deviceType() == null || !DEVICE_TYPES.contains(request.deviceType())) {
            errors.put("deviceType", "Select a valid device type.");
        }
        if (!errors.isEmpty()) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.", errors
            );
        }

        String analysisId = trim(request.analysisId());
        if (!analysisId.isEmpty()) {
            jdbc.query(
                    "SELECT id FROM assessments WHERE id = ?" + ownerClause(userId),
                    rs -> {
                        if (!rs.next()) {
                            throw notFound("The linked assessment could not be found.");
                        }
                        return rs.getString("id");
                    },
                    userId == null ? new Object[]{analysisId} : new Object[]{analysisId, userId}
            );
        }

        String id = newId("PU");
        String reference = newId("ER").toUpperCase();
        String fullAddress = address + ", " + city + ", " + state + " - " + pinCode;
        jdbc.update(
                """
                INSERT INTO pickups (
                    id, reference, user_id, analysis_id, full_name, phone,
                    address, city, state, pin_code, pickup_date, time_slot,
                    instructions, device_type, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id,
                reference,
                userId,
                analysisId.isEmpty() ? null : analysisId,
                name,
                phone,
                address,
                city,
                state,
                pinCode,
                pickupDate.toString(),
                request.timeSlot(),
                trim(request.instructions()),
                request.deviceType(),
                "SCHEDULED",
                Timestamp.from(Instant.now())
        );
        return pickupResponse(
                id, reference, name, phone, address, city, state, pinCode,
                pickupDate.toString(), request.timeSlot(), "SCHEDULED"
        );
    }

    public Map<String, Object> register(AuthRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Account details are required.");
        }
        String name = trim(request.name());
        String email = trim(request.email()).toLowerCase();
        String password = request.password() == null ? "" : request.password();
        if (name.length() < 2 || name.length() > 80) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter your full name.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        if (password.length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
        }
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email
        );
        if (existing != null && existing > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, name);
            statement.setString(2, email);
            statement.setString(3, passwordEncoder.encode(password));
            return statement;
        }, keyHolder);
        Number userId = keyHolder.getKey();
        if (userId == null) {
            throw new IllegalStateException("The new account ID was not generated.");
        }
        return authResponse(userId.longValue(), name, email);
    }

    public Map<String, Object> login(AuthRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }
        String email = trim(request.email()).toLowerCase();
        String password = request.password() == null ? "" : request.password();
        Map<String, Object> user;
        try {
            user = jdbc.queryForMap(
                    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
                    email
            );
        } catch (EmptyResultDataAccessException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        if (!passwordEncoder.matches(password, (String) user.get("PASSWORD_HASH"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        return authResponse(
                ((Number) user.get("ID")).longValue(),
                (String) user.get("NAME"),
                (String) user.get("EMAIL")
        );
    }

    public Map<String, Object> forgotPassword(String email) {
        if (email == null || !email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        throw new ApiException(
                HttpStatus.NOT_IMPLEMENTED,
                "Password reset email is not configured for this backend."
        );
    }

    private Map<String, Object> authResponse(long userId, String name, String email) {
        String token = UUID.randomUUID().toString();
        jdbc.update(
                "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
                token, userId, Timestamp.from(Instant.now())
        );
        return Map.of(
                "token", token,
                "user", Map.of("id", userId, "name", name, "email", email)
        );
    }

    private List<Map<String, Object>> listAnalyses(Long userId) {
        String sql = "SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC";
        return jdbc.query(sql, (rs, rowNum) -> assessmentResponse(rs), userId);
    }

    private List<Map<String, Object>> listPickups(Long userId) {
        String sql = "SELECT * FROM pickups WHERE user_id = ? ORDER BY created_at DESC";
        return jdbc.query(sql, (rs, rowNum) -> pickupResponse(rs), userId);
    }

    private Map<String, Object> assessmentResponse(ResultSet rs) throws java.sql.SQLException {
        String id = rs.getString("id");
        String deviceType = rs.getString("device_type");
        String recommendation = rs.getString("recommendation");
        Estimate estimate = new Estimate(
                rs.getDouble("estimated_value_min"),
                rs.getDouble("estimated_value_max"),
                rs.getString("value_type"),
                rs.getDouble("estimated_weight_kg"),
                rs.getDouble("co2_saved_kg"),
                splitMaterials(rs.getString("recoverable_materials"))
        );
        return assessmentResponse(
                id, deviceType, recommendation, rs.getString("reason"),
                rs.getString("preference"), estimate,
                rs.getTimestamp("created_at").toInstant(),
                rs.getString("image_content_type") != null
        );
    }

    private Map<String, Object> assessmentResponse(
            String id,
            String deviceType,
            String recommendation,
            String reason,
            String preference,
            Estimate estimate,
            Instant createdAt,
            boolean hasImage
    ) {
        String imageUrl = hasImage ? "/api/analyses/" + id + "/image" : "";
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("surveyId", id);
        result.put("deviceType", deviceType);
        result.put("component", DEVICE_LABELS.getOrDefault(deviceType, "Electronic Device"));
        result.put("recommendation", recommendation);
        result.put("reusability", recommendation);
        result.put("reason", reason);
        result.put("suggestion", reason);
        result.put("repair_suggestion", reason);
        result.put("matchesPreference", recommendation.equalsIgnoreCase(preference));
        result.put("nextRoute", "/schedule-pickup");
        result.put("estimatedValueMin", estimate.valueMin());
        result.put("estimatedValueMax", estimate.valueMax());
        result.put("price_min", estimate.valueMin());
        result.put("price_max", estimate.valueMax());
        result.put("valueType", estimate.valueType());
        result.put("estimatedWeightKg", estimate.weightKg());
        result.put("wasteDivertedKg", estimate.weightKg());
        result.put("co2SavedKg", estimate.co2SavedKg());
        result.put("co2_saved", estimate.co2SavedKg());
        result.put("recoverableMaterials", estimate.materials());
        result.put(
                "environmentalNote",
                "Indicative estimates based on typical device weights and category-level assumptions. Actual values depend on physical inspection and processing."
        );
        result.put("image", imageUrl);
        result.put("imageUrl", imageUrl);
        result.put("image_url", imageUrl);
        result.put("createdAt", createdAt.toString());
        result.put("created_at", createdAt.toString());
        return result;
    }

    private Map<String, Object> pickupResponse(ResultSet rs) throws java.sql.SQLException {
        return pickupResponse(
                rs.getString("id"),
                rs.getString("reference"),
                rs.getString("full_name"),
                rs.getString("phone"),
                rs.getString("address"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("pin_code"),
                rs.getString("pickup_date"),
                rs.getString("time_slot"),
                rs.getString("status")
        );
    }

    private Map<String, Object> pickupResponse(
            String id,
            String reference,
            String name,
            String phone,
            String address,
            String city,
            String state,
            String pinCode,
            String pickupDate,
            String timeSlot,
            String status
    ) {
        String fullAddress = address + ", " + city + ", " + state + " - " + pinCode;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", id);
        result.put("bookingId", id);
        result.put("reference", reference);
        result.put("fullName", name);
        result.put("phone", phone);
        result.put("address", fullAddress);
        result.put("pickupAddress", fullAddress);
        result.put("city", city);
        result.put("state", state);
        result.put("pinCode", pinCode);
        result.put("pincode", pinCode);
        result.put("date", pickupDate);
        result.put("pickupDate", pickupDate);
        result.put("time", timeSlot);
        result.put("timeSlot", timeSlot);
        result.put("status", status);
        return result;
    }

    private Estimate estimate(String device, String condition, String damage, String recommendation) {
        double[] base = switch (device) {
            case "mobile_phone" -> new double[]{0.2, 1500, 12000, 100, 700, 45, 8};
            case "laptop" -> new double[]{2.0, 3000, 25000, 300, 1500, 180, 30};
            case "tablet" -> new double[]{0.5, 1000, 8000, 100, 500, 70, 12};
            case "desktop" -> new double[]{8.0, 2000, 15000, 500, 2500, 250, 45};
            case "motherboard" -> new double[]{0.7, 300, 4000, 100, 1200, 35, 10};
            case "monitor" -> new double[]{4.0, 500, 5000, 150, 1000, 100, 20};
            case "keyboard" -> new double[]{0.5, 100, 800, 20, 150, 8, 2};
            case "mouse" -> new double[]{0.1, 50, 500, 10, 80, 4, 1};
            case "battery" -> new double[]{0.5, 100, 1000, 30, 300, 15, 5};
            case "charger" -> new double[]{0.2, 50, 500, 15, 100, 8, 2};
            case "cables" -> new double[]{0.3, 20, 300, 10, 100, 5, 2};
            case "circuit_board" -> new double[]{0.5, 100, 1500, 50, 500, 30, 8};
            default -> new double[]{1.0, 100, 2000, 30, 500, 20, 5};
        };
        double conditionFactor = switch (condition) {
            case "working_perfectly" -> 1.0;
            case "minor_issues" -> 0.75;
            case "major_damage" -> 0.45;
            default -> 0.25;
        };
        double damageFactor = switch (damage) {
            case "no_damage" -> 1.0;
            case "cracked_screen" -> 0.9;
            case "damaged_body" -> 0.82;
            default -> 0.75;
        };
        boolean reuse = "REUSE".equals(recommendation);
        double valueMin = reuse ? base[1] * conditionFactor * damageFactor
                : base[3] * conditionFactor * damageFactor;
        double valueMax = reuse ? base[2] * conditionFactor * damageFactor
                : base[4] * conditionFactor * damageFactor;
        double co2 = (reuse ? base[5] * conditionFactor : base[6] * damageFactor);
        String valueType = reuse ? "Estimated resale value" : "Estimated recycling / scrap value";

        List<String> materials = switch (device) {
            case "mobile_phone" -> List.of("Copper", "Aluminium", "Glass", "Plastic");
            case "laptop" -> List.of("Copper", "Aluminium", "Plastic", "Lithium");
            case "tablet" -> List.of("Aluminium", "Copper", "Glass", "Plastic");
            case "desktop" -> List.of("Steel", "Copper", "Aluminium", "Plastic");
            case "motherboard", "circuit_board" ->
                    List.of("Copper", "Gold-plated connectors", "Silver", "Electronic components");
            case "monitor" -> List.of("Glass", "Copper", "Plastic", "Aluminium");
            case "keyboard", "mouse" -> List.of("Plastic", "Copper", "Electronic components");
            case "battery" -> List.of("Lithium", "Nickel", "Cobalt", "Steel");
            case "charger" -> List.of("Copper", "Plastic", "Electronic components");
            case "cables" -> List.of("Copper", "Aluminium", "Plastic");
            default -> List.of("Copper", "Plastic", "Steel", "Electronic components");
        };
        return new Estimate(
                Math.round(valueMin),
                Math.round(valueMax),
                valueType,
                base[0],
                Math.round(co2 * 10.0) / 10.0,
                materials
        );
    }

    private void validate(
            Map<String, String> errors,
            String key,
            String value,
            Set<String> allowed
    ) {
        if (value == null || value.isBlank()) {
            errors.put(key, "This question is required.");
        } else if (!allowed.contains(value)) {
            errors.put(key, "Invalid option.");
        }
    }

    private String ownerClause(Long userId) {
        return " AND user_id = ?";
    }

    private List<String> splitMaterials(String materials) {
        if (materials == null || materials.isBlank()) {
            return new ArrayList<>();
        }
        return List.of(materials.split("\\|"));
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public record SurveyRequest(
            String deviceType,
            String powersOn,
            String condition,
            String physicalDamage,
            String preference
    ) {}

    public record PickupRequest(
            String fullName,
            String phone,
            String address,
            String city,
            String state,
            String pinCode,
            String pickupDate,
            String timeSlot,
            String instructions,
            String deviceType,
            String analysisId
    ) {}

    public record AuthRequest(String name, String email, String password) {}

    public record StoredImage(byte[] bytes, String contentType) {}

    private record Estimate(
            double valueMin,
            double valueMax,
            String valueType,
            double weightKg,
            double co2SavedKg,
            List<String> materials
    ) {}
}
