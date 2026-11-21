
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EReviveServer {

    static final int PORT = Integer.parseInt(
    System.getenv().getOrDefault("PORT", "8080")
);
    static final String ALLOWED_ORIGIN = "*";
    static final long MAX_BODY_BYTES = 100L * 1024 * 1024;

    static final Set<String> DEVICE_TYPES = Set.of(
            "mobile_phone", "laptop", "tablet", "desktop",
            "motherboard", "monitor", "keyboard", "mouse",
            "battery", "charger", "cables", "circuit_board", "other"
    );

    static final Set<String> POWERS =
            Set.of("yes", "no", "not_sure");

    static final Set<String> CONDITIONS = Set.of(
            "working_perfectly", "minor_issues",
            "major_damage", "not_working"
    );

    static final Set<String> DAMAGES = Set.of(
            "no_damage", "cracked_screen",
            "damaged_body", "other_damage"
    );

    static final Set<String> PREFERENCES =
            Set.of("reuse", "recycle");

    static final Set<String> TIME_SLOTS = Set.of(
            "09:00-11:00",
            "11:00-13:00",
            "14:00-16:00",
            "16:00-18:00"
    );

    static final Set<String> ALLOWED_EXT =
            Set.of("jpg", "jpeg", "png", "webp", "mp4");

    static final Map<String, Map<String, Object>> SURVEYS =
            new ConcurrentHashMap<>();

    static final Map<String, Map<String, Object>> PICKUPS =
            new ConcurrentHashMap<>();

    static final Map<String, Map<String, Object>> ASSESSMENTS =
            new ConcurrentHashMap<>();

    static final Map<String, Map<String, Object>> RECYCLE_SUBMISSIONS =
            new ConcurrentHashMap<>();

    // ================= SERVER =================

    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(
                new InetSocketAddress(PORT), 0
        );

        route(server, "/api/health", "GET", 200,
                ex -> map(
                        "status", "UP",
                        "service", "E-Revive Backend"
                )
        );

        route(server, "/api/survey", "POST", 201,
                ex -> submitSurvey(parseJson(readBody(ex)))
        );

        route(server, "/api/pickups", "POST", 201,
                ex -> schedulePickup(parseJson(readBody(ex)))
        );

        route(server, "/api/recycle/analyze", "POST", 200,
                EReviveServer::analyzeDevice
        );

        route(server, "/api/recycle/submit", "POST", 201,
                ex -> submitRecycle(parseJson(readBody(ex)))
        );

        server.createContext("/api/analyses/", ex -> {
            addCors(ex);

            try {
                if (ex.getRequestMethod().equals("OPTIONS")) {
                    ex.sendResponseHeaders(204, -1);
                    ex.close();
                    return;
                }

                if (!ex.getRequestMethod().equals("GET")) {
                    throw new ApiException(405, "Method not allowed", null);
                }

                String id = ex.getRequestURI().getPath()
                        .substring("/api/analyses/".length());

                Map<String, Object> result = SURVEYS.get(id);

                if (result == null) {
                    result = ASSESSMENTS.get(id);
                }

                if (result == null) {
                    throw new ApiException(404, "Assessment not found", null);
                }

                send(ex, 200, result);

            } catch (ApiException ae) {
                sendError(ex, ae);
            } catch (Exception e) {
                e.printStackTrace();
                send(ex, 500, map(
                        "status", 500,
                        "message", "Something went wrong"
                ));
            }
        });

        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println(
                "E-Revive backend running at http://localhost:"
                        + PORT + "/api/health"
        );
    }

    // ================= SURVEY =================

    static Object submitSurvey(Map<String, String> in) {

        Map<String, String> errors = new LinkedHashMap<>();

        validate(in, "deviceType", DEVICE_TYPES, errors);
        validate(in, "powersOn", POWERS, errors);
        validate(in, "condition", CONDITIONS, errors);
        validate(in, "physicalDamage", DAMAGES, errors);
        validate(in, "preference", PREFERENCES, errors);

        if (!errors.isEmpty()) {
            throw new ApiException(
                    400, "Please answer all questions", errors
            );
        }

        String device = in.get("deviceType");
        String power = in.get("powersOn");
        String condition = in.get("condition");
        String damage = in.get("physicalDamage");

        // Battery safety: damaged batteries must not be reused.
        if (device.equals("battery") &&
                (!damage.equals("no_damage") ||
                 condition.equals("major_damage") ||
                 condition.equals("not_working"))) {

            throw new ApiException(
                    400,
                    "Damaged or unsafe batteries must be handled by an authorized battery recycling professional.",
                    null
            );
        }

        int score = 0;

        if (power.equals("yes")) {
            score += 2;
        } else if (power.equals("no")) {
            score -= 3;
        }

        switch (condition) {
            case "working_perfectly" -> score += 3;
            case "minor_issues" -> score += 1;
            case "major_damage" -> score -= 3;
            case "not_working" -> score -= 4;
        }

        switch (damage) {
            case "no_damage" -> score += 2;
            case "cracked_screen" -> score -= 1;
            case "damaged_body" -> score -= 2;
            case "other_damage" -> score -= 1;
        }

        String recommendation;

        if (score > 0) {
            recommendation = "REUSE";
        } else if (score < 0) {
            recommendation = "RECYCLE";
        } else {
            recommendation = in.get("preference").equals("reuse")
                    ? "REUSE" : "RECYCLE";
        }

        String reason = recommendation.equals("REUSE")
                ? "This electronic item appears suitable for reuse or refurbishment after professional inspection."
                : "This electronic item is recommended for responsible recycling and material recovery.";

        Map<String, Object> estimate =
                calculateEnvironmentalImpact(
                        device, condition, recommendation
                );

        String surveyId = newId("SV");

        Map<String, Object> result = map(
                "surveyId", surveyId,
                "id", surveyId,
                "deviceType", device,
                "recommendation", recommendation,
                "reason", reason,
                "matchesPreference",
                recommendation.equalsIgnoreCase(in.get("preference")),
                "nextRoute",
                recommendation.equals("REUSE")
                        ? "/pickup" : "/recycle",
                "createdAt", Instant.now().toString()
        );

        result.putAll(estimate);

        SURVEYS.put(surveyId, result);

        return result;
    }

    // ================= ENVIRONMENTAL CALCULATOR =================

    static Map<String, Object> calculateEnvironmentalImpact(
            String device,
            String condition,
            String recommendation
    ) {

        double weight;
        double reuseMin;
        double reuseMax;
        double scrapMin;
        double scrapMax;
        double reuseCO2;
        double recycleCO2;

        List<String> materials = new ArrayList<>();

        switch (device) {

            case "mobile_phone" -> {
                weight = 0.20;
                reuseMin = 1500;
                reuseMax = 12000;
                scrapMin = 100;
                scrapMax = 700;
                reuseCO2 = 45;
                recycleCO2 = 8;

                materials.addAll(List.of(
                        "Copper", "Aluminium",
                        "Glass", "Plastic"
                ));
            }

            case "laptop" -> {
                weight = 2.0;
                reuseMin = 3000;
                reuseMax = 25000;
                scrapMin = 300;
                scrapMax = 1500;
                reuseCO2 = 180;
                recycleCO2 = 30;

                materials.addAll(List.of(
                        "Copper", "Aluminium",
                        "Plastic", "Lithium"
                ));
            }

            case "tablet" -> {
                weight = 0.50;
                reuseMin = 1000;
                reuseMax = 8000;
                scrapMin = 100;
                scrapMax = 500;
                reuseCO2 = 70;
                recycleCO2 = 12;

                materials.addAll(List.of(
                        "Aluminium", "Copper",
                        "Glass", "Plastic"
                ));
            }

            case "desktop" -> {
                weight = 8.0;
                reuseMin = 2000;
                reuseMax = 15000;
                scrapMin = 500;
                scrapMax = 2500;
                reuseCO2 = 250;
                recycleCO2 = 45;

                materials.addAll(List.of(
                        "Steel", "Copper",
                        "Aluminium", "Plastic"
                ));
            }

            case "motherboard" -> {
                weight = 0.70;
                reuseMin = 300;
                reuseMax = 4000;
                scrapMin = 100;
                scrapMax = 1200;
                reuseCO2 = 35;
                recycleCO2 = 10;

                materials.addAll(List.of(
                        "Copper", "Gold-plated connectors",
                        "Silver", "Electronic components"
                ));
            }

            case "monitor" -> {
                weight = 4.0;
                reuseMin = 500;
                reuseMax = 5000;
                scrapMin = 150;
                scrapMax = 1000;
                reuseCO2 = 100;
                recycleCO2 = 20;

                materials.addAll(List.of(
                        "Glass", "Copper",
                        "Plastic", "Aluminium"
                ));
            }

            case "keyboard" -> {
                weight = 0.50;
                reuseMin = 100;
                reuseMax = 800;
                scrapMin = 20;
                scrapMax = 150;
                reuseCO2 = 8;
                recycleCO2 = 2;

                materials.addAll(List.of(
                        "Plastic", "Copper",
                        "Electronic components"
                ));
            }

            case "mouse" -> {
                weight = 0.10;
                reuseMin = 50;
                reuseMax = 500;
                scrapMin = 10;
                scrapMax = 80;
                reuseCO2 = 4;
                recycleCO2 = 1;

                materials.addAll(List.of(
                        "Plastic", "Copper",
                        "Electronic components"
                ));
            }

            case "battery" -> {
                weight = 0.50;
                reuseMin = 100;
                reuseMax = 1000;
                scrapMin = 30;
                scrapMax = 300;
                reuseCO2 = 15;
                recycleCO2 = 5;

                materials.addAll(List.of(
                        "Lithium", "Nickel",
                        "Cobalt", "Steel"
                ));
            }

            case "charger" -> {
                weight = 0.20;
                reuseMin = 50;
                reuseMax = 500;
                scrapMin = 15;
                scrapMax = 100;
                reuseCO2 = 8;
                recycleCO2 = 2;

                materials.addAll(List.of(
                        "Copper", "Plastic",
                        "Electronic components"
                ));
            }

            case "cables" -> {
                weight = 0.30;
                reuseMin = 20;
                reuseMax = 300;
                scrapMin = 10;
                scrapMax = 100;
                reuseCO2 = 5;
                recycleCO2 = 2;

                materials.addAll(List.of(
                        "Copper", "Aluminium", "Plastic"
                ));
            }

            case "circuit_board" -> {
                weight = 0.50;
                reuseMin = 100;
                reuseMax = 1500;
                scrapMin = 50;
                scrapMax = 500;
                reuseCO2 = 30;
                recycleCO2 = 8;

                materials.addAll(List.of(
                        "Copper", "Gold-plated connectors",
                        "Silver", "Electronic components"
                ));
            }

            default -> {
                weight = 1.0;
                reuseMin = 100;
                reuseMax = 2000;
                scrapMin = 30;
                scrapMax = 500;
                reuseCO2 = 20;
                recycleCO2 = 5;

                materials.addAll(List.of(
                        "Copper", "Plastic",
                        "Steel", "Electronic components"
                ));
            }
        }

        double conditionFactor = switch (condition) {
            case "working_perfectly" -> 1.0;
            case "minor_issues" -> 0.75;
            case "major_damage" -> 0.35;
            case "not_working" -> 0.15;
            default -> 0.50;
        };

        double valueMin;
        double valueMax;
        double co2Saved;
        String valueType;

        if (recommendation.equals("REUSE")) {
            valueMin = reuseMin * conditionFactor;
            valueMax = reuseMax * conditionFactor;
            co2Saved = reuseCO2 * conditionFactor;
            valueType = "Estimated resale value";
        } else {
            valueMin = scrapMin;
            valueMax = scrapMax;
            co2Saved = recycleCO2;
            valueType = "Estimated recycling / scrap value";
        }

        valueMin = Math.round(valueMin);
        valueMax = Math.round(valueMax);
        co2Saved = Math.round(co2Saved * 10.0) / 10.0;

        return map(
                "estimatedValueMin", valueMin,
                "estimatedValueMax", valueMax,
                "valueType", valueType,
                "estimatedWeightKg", weight,
                "wasteDivertedKg", weight,
                "co2SavedKg", co2Saved,
                "recoverableMaterials", materials,
                "environmentalNote",
                "Indicative estimates based on typical device weights and category-level assumptions. Actual values depend on physical inspection and processing."
        );
    }

    // ================= VALIDATION =================

    static void validate(
            Map<String, String> input,
            String key,
            Set<String> allowed,
            Map<String, String> errors
    ) {

        String value = input.get(key);

        if (value == null || value.isBlank()) {
            errors.put(key, "This question is required");
        } else if (!allowed.contains(value)) {
            errors.put(key, "Invalid option: " + value);
        }
    }

    // ================= PICKUP =================

    static Object schedulePickup(Map<String, String> in) {

        Map<String, String> errors = new LinkedHashMap<>();

        String name = in.getOrDefault("fullName", "").trim();
        String phone = in.getOrDefault("phone", "").trim();
        String address = in.getOrDefault("address", "").trim();

        if (name.length() < 2 || name.length() > 80) {
            errors.put("fullName", "Enter your full name");
        }

        if (!phone.matches("^(\\+91[- ]?)?[6-9]\\d{9}$")) {
            errors.put("phone", "Enter a valid mobile number");
        }

        if (address.isEmpty()) {
            errors.put("address", "Pickup address is required");
        }

        if (in.getOrDefault("city", "").isBlank()) {
            errors.put("city", "City is required");
        }

        if (!in.getOrDefault("pinCode", "").matches("^[1-9]\\d{5}$")) {
            errors.put("pinCode", "Enter a valid PIN code");
        }

        LocalDate date;

        try {
            date = LocalDate.parse(
                    in.getOrDefault("pickupDate", "")
            );

            if (date.isBefore(LocalDate.now())) {
                errors.put("pickupDate", "Date cannot be in the past");
            }

            if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                errors.put("pickupDate", "Sunday pickups are unavailable");
            }

        } catch (Exception e) {
            date = null;
            errors.put("pickupDate", "Select a valid date");
        }

        if (!TIME_SLOTS.contains(
                in.getOrDefault("timeSlot", "")
        )) {
            errors.put("timeSlot", "Select a valid time slot");
        }

        if (!DEVICE_TYPES.contains(
                in.getOrDefault("deviceType", "")
        )) {
            errors.put("deviceType", "Select a valid device type");
        }

        if (!errors.isEmpty()) {
            throw new ApiException(
                    400, "Please correct the highlighted fields", errors
            );
        }

        Map<String, Object> result = map(
                "bookingId", newId("PU"),
                "status", "SCHEDULED",
                "message", "Pickup scheduled successfully",
                "pickupDate", date.toString(),
                "timeSlot", in.get("timeSlot"),
                "pickupAddress",
                address + ", " + in.get("city")
                        + " - " + in.get("pinCode")
        );

        PICKUPS.put(
                (String) result.get("bookingId"), result
        );

        return result;
    }

    // ================= RECYCLE ANALYSIS =================

    static Object analyzeDevice(HttpExchange ex) throws Exception {

        String contentType =
                ex.getRequestHeaders().getFirst("Content-Type");

        if (contentType == null ||
                !contentType.toLowerCase().startsWith("multipart/form-data")) {
            throw new ApiException(
                    400, "Send multipart/form-data", null
            );
        }

        Multipart mp = parseMultipart(
                readBody(ex), contentType
        );

        if (mp.fileNames.isEmpty()) {
            throw new ApiException(
                    400, "Please upload an electronic waste image", null
            );
        }

        if (mp.fileNames.size() > 8) {
            throw new ApiException(
                    400, "Maximum 8 files allowed", null
            );
        }

        for (String file : mp.fileNames) {

            String ext = file.contains(".")
                    ? file.substring(file.lastIndexOf('.') + 1).toLowerCase()
                    : "";

            if (!ALLOWED_EXT.contains(ext)) {
                throw new ApiException(
                        400, "Unsupported file: " + file, null
                );
            }
        }

        String description =
                mp.fields.getOrDefault("description", "");

        String deviceType =
                mp.fields.getOrDefault("deviceType", "other");

        if (!DEVICE_TYPES.contains(deviceType)) {
            deviceType = "other";
        }

        Map<String, Object> result = simulateDevice(
                mp.fileNames, description, deviceType
        );

        ASSESSMENTS.put(
                (String) result.get("analysisId"), result
        );

        return result;
    }

    static Map<String, Object> simulateDevice(
            List<String> files,
            String description,
            String deviceType
    ) {

        String device = switch (deviceType) {
            case "mobile_phone" -> "Smartphone";
            case "laptop" -> "Laptop";
            case "tablet" -> "Tablet";
            case "desktop" -> "Desktop";
            case "motherboard" -> "Motherboard";
            case "monitor" -> "Monitor";
            case "keyboard" -> "Keyboard";
            case "mouse" -> "Mouse";
            case "battery" -> "Battery";
            case "charger" -> "Charger";
            case "cables" -> "Cables";
            case "circuit_board" -> "Circuit Board";
            default -> "Electronic device";
        };

        List<String> reusable = new ArrayList<>();
        List<String> materials = new ArrayList<>();

        switch (deviceType) {

            case "mobile_phone" -> {
                reusable.addAll(List.of(
                        "Camera module", "Speaker",
                        "Charging port", "Display after inspection"
                ));
                materials.addAll(List.of(
                        "Copper", "Aluminium", "Glass", "Plastic"
                ));
            }

            case "laptop" -> {
                reusable.addAll(List.of(
                        "RAM", "SSD/HDD", "Keyboard",
                        "Display", "Cooling fan"
                ));
                materials.addAll(List.of(
                        "Aluminium", "Copper", "Plastic", "Lithium"
                ));
            }

            case "motherboard", "circuit_board" -> {
                reusable.addAll(List.of(
                        "RAM slots", "Connectors",
                        "IC chips", "Capacitors after inspection"
                ));
                materials.addAll(List.of(
                        "Copper", "Gold-plated connectors",
                        "Aluminium", "Electronic components"
                ));
            }

            case "battery" -> {
                reusable.add(
                        "Reuse only after professional safety testing"
                );
                materials.addAll(List.of(
                        "Lithium", "Nickel", "Cobalt", "Steel"
                ));
            }

            case "monitor" -> {
                reusable.addAll(List.of(
                        "Display panel", "Power board",
                        "Connectors", "Stand"
                ));
                materials.addAll(List.of(
                        "Glass", "Copper", "Plastic", "Aluminium"
                ));
            }

            case "keyboard", "mouse" -> {
                reusable.addAll(List.of(
                        "Buttons", "Switches",
                        "Cable", "Electronic circuit board"
                ));
                materials.addAll(List.of(
                        "Plastic", "Copper", "Electronic components"
                ));
            }

            default -> {
                reusable.addAll(List.of(
                        "Connectors", "Cables",
                        "Electronic components after inspection"
                ));
                materials.addAll(List.of(
                        "Copper", "Plastic", "Steel"
                ));
            }
        }

        Map<String, Object> result = map(
                "analysisId", newId("AN"),
                "simulated", true,
                "deviceType", deviceType,
                "deviceIdentified", device,
                "estimatedCondition", "Requires physical inspection",
                "confidencePercent", 0,
                "reusableComponents", reusable,
                "recoverableMaterials", materials,
                "recommendation",
                "This is a category-based assessment, not automatic image recognition. Physical inspection is required.",
                "filesAnalyzed", files.size()
        );

        return result;
    }

    // ================= RECYCLE SUBMISSION =================

    static Object submitRecycle(Map<String, String> in) {

        String analysisId =
                in.getOrDefault("analysisId", "");

        if (!ASSESSMENTS.containsKey(analysisId)) {
            throw new ApiException(
                    404, "Assessment not found", null
            );
        }

        Map<String, Object> result = map(
                "submissionId", newId("RC"),
                "analysisId", analysisId,
                "status", "SUBMITTED",
                "message", "Recycling submission successful",
                "submittedAt", Instant.now().toString()
        );

        RECYCLE_SUBMISSIONS.put(
                (String) result.get("submissionId"), result
        );

        return result;
    }

    // ================= MULTIPART =================

    static class Multipart {
        final Map<String, String> fields = new HashMap<>();
        final List<String> fileNames = new ArrayList<>();
    }

    static Multipart parseMultipart(
            byte[] body,
            String contentType
    ) {

        Matcher boundaryMatcher = Pattern.compile(
                "boundary=(?:\"([^\"]+)\"|([^;]+))"
        ).matcher(contentType);

        if (!boundaryMatcher.find()) {
            throw new ApiException(
                    400, "Missing multipart boundary", null
            );
        }

        String boundary = "--" +
                (boundaryMatcher.group(1) != null
                        ? boundaryMatcher.group(1)
                        : boundaryMatcher.group(2).trim());

        Multipart result = new Multipart();

        String raw = new String(
                body, StandardCharsets.ISO_8859_1
        );

        for (String part : raw.split(Pattern.quote(boundary))) {

            if (part.startsWith("--") || part.isBlank()) {
                continue;
            }

            if (part.startsWith("\r\n")) {
                part = part.substring(2);
            }

            int headEnd = part.indexOf("\r\n\r\n");

            if (headEnd < 0) continue;

            String headers = part.substring(0, headEnd);
            String content = part.substring(headEnd + 4);

            if (content.endsWith("\r\n")) {
                content = content.substring(0, content.length() - 2);
            }

            Matcher name = Pattern.compile(
                    ";\\s*name=\"([^\"]*)\""
            ).matcher(headers);

            Matcher file = Pattern.compile(
                    "filename=\"([^\"]*)\""
            ).matcher(headers);

            if (!name.find()) continue;

            if (file.find()) {
                if (!file.group(1).isEmpty() && !content.isEmpty()) {
                    result.fileNames.add(file.group(1));
                }
            } else {
                result.fields.put(
                        name.group(1),
                        new String(
                                content.getBytes(
                                        StandardCharsets.ISO_8859_1
                                ),
                                StandardCharsets.UTF_8
                        )
                );
            }
        }

        return result;
    }

    // ================= HTTP HELPERS =================

    interface Handler {
        Object handle(HttpExchange ex) throws Exception;
    }

    static void route(
            HttpServer server,
            String path,
            String method,
            int okStatus,
            Handler handler
    ) {

        server.createContext(path, ex -> {

            addCors(ex);

            try {

                if (ex.getRequestMethod().equals("OPTIONS")) {
                    ex.sendResponseHeaders(204, -1);
                    ex.close();
                    return;
                }

                if (!ex.getRequestMethod().equals(method)) {
                    throw new ApiException(
                            405, "Method not allowed", null
                    );
                }

                send(ex, okStatus, handler.handle(ex));

            } catch (ApiException ae) {
                sendError(ex, ae);

            } catch (Exception e) {
                e.printStackTrace();

                send(ex, 500, map(
                        "status", 500,
                        "message", "Something went wrong. Please try again."
                ));
            }
        });
    }

    static void addCors(HttpExchange ex) {

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Origin", ALLOWED_ORIGIN
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS"
        );

        ex.getResponseHeaders().set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization"
        );
    }

    static void sendError(
            HttpExchange ex,
            ApiException ae
    ) {

        Map<String, Object> body = map(
                "timestamp", Instant.now().toString(),
                "status", ae.status,
                "message", ae.getMessage()
        );

        if (ae.fieldErrors != null) {
            body.put("fieldErrors", ae.fieldErrors);
        }

        send(ex, ae.status, body);
    }

    static void send(
            HttpExchange ex,
            int status,
            Object body
    ) {

        try {

            byte[] bytes = toJson(body).getBytes(
                    StandardCharsets.UTF_8
            );

            ex.getResponseHeaders().set(
                    "Content-Type",
                    "application/json; charset=utf-8"
            );

            ex.sendResponseHeaders(status, bytes.length);

            ex.getResponseBody().write(bytes);

        } catch (Exception ignored) {
        } finally {
            ex.close();
        }
    }

    static byte[] readBody(HttpExchange ex) throws Exception {

        byte[] body = ex.getRequestBody().readNBytes(
                (int) MAX_BODY_BYTES + 1
        );

        if (body.length > MAX_BODY_BYTES) {
            throw new ApiException(
                    413, "Upload is too large (max 100 MB)", null
            );
        }

        return body;
    }

    static class ApiException extends RuntimeException {

        final int status;
        final Map<String, String> fieldErrors;

        ApiException(
                int status,
                String message,
                Map<String, String> fieldErrors
        ) {
            super(message);
            this.status = status;
            this.fieldErrors = fieldErrors;
        }
    }

    // ================= JSON HELPERS =================

    static Map<String, String> parseJson(byte[] body) {

        String json = new String(
                body, StandardCharsets.UTF_8
        );

        if (!json.trim().startsWith("{")) {
            throw new ApiException(
                    400, "Request body must be a JSON object", null
            );
        }

        Map<String, String> out = new LinkedHashMap<>();

        Matcher m = Pattern.compile(
                "\"([^\"]+)\"\\s*:\\s*(?:\"((?:[^\"\\\\]|\\\\.)*)\"|([^,}\\s]+))"
        ).matcher(json);

        while (m.find()) {

            String value = m.group(2) != null
                    ? m.group(2)
                    .replace("\\n", "\n")
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\")
                    : m.group(3);

            out.put(
                    m.group(1),
                    "null".equals(value) ? "" : value
            );
        }

        return out;
    }

    static String toJson(Object o) {

        if (o == null) return "null";

        if (o instanceof Number || o instanceof Boolean) {
            return o.toString();
        }

        if (o instanceof Map<?, ?> m) {

            StringJoiner j = new StringJoiner(",", "{", "}");

            m.forEach((k, v) ->
                    j.add(
                            "\"" + esc(String.valueOf(k))
                                    + "\":" + toJson(v)
                    )
            );

            return j.toString();
        }

        if (o instanceof Collection<?> c) {

            StringJoiner j = new StringJoiner(",", "[", "]");

            for (Object x : c) {
                j.add(toJson(x));
            }

            return j.toString();
        }

        return "\"" + esc(o.toString()) + "\"";
    }

    static String esc(String s) {

        StringBuilder sb = new StringBuilder();

        for (char c : s.toCharArray()) {

            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");

                default -> {
                    if (c < 0x20) {
                        sb.append(
                                String.format("\\u%04x", (int) c)
                        );
                    } else {
                        sb.append(c);
                    }
                }
            }
        }

        return sb.toString();
    }

    // ================= ID GENERATOR =================

    static final SecureRandom RANDOM = new SecureRandom();

    static final String ID_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    static String newId(String prefix) {

        StringBuilder sb = new StringBuilder(
                "ER-" + prefix + "-"
                        + LocalDate.now().format(
                                DateTimeFormatter.ofPattern("yyyyMMdd")
                        ) + "-"
        );

        for (int i = 0; i < 5; i++) {
            sb.append(
                    ID_CHARS.charAt(
                            RANDOM.nextInt(ID_CHARS.length())
                    )
            );
        }

        return sb.toString();
    }

    // ================= MAP HELPER =================

    static Map<String, Object> map(Object... kv) {

        Map<String, Object> result = new LinkedHashMap<>();

        for (int i = 0; i < kv.length; i += 2) {
            result.put(
                    (String) kv[i],
                    kv[i + 1]
            );
        }

        return result;
    }
}
