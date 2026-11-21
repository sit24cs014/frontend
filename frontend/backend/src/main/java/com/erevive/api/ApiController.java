package com.erevive.api;

import java.io.IOException;
import java.util.Map;

import com.erevive.service.EReviveService;
import com.erevive.service.EReviveService.PickupRequest;
import com.erevive.service.EReviveService.SurveyRequest;
import com.erevive.service.EReviveService.StoredImage;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final EReviveService service;

    public ApiController(EReviveService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "E:Revive Backend");
    }

    @PostMapping(value = "/survey", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> submitSurveyJson(
            @RequestBody SurveyRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) throws IOException {
        return service.submitSurvey(request, null, service.requireUserId(authorization));
    }

    @PostMapping(value = "/survey", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> submitSurveyMultipart(
            @RequestParam MultiValueMap<String, String> fields,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) throws IOException {
        SurveyRequest request = new SurveyRequest(
                fields.getFirst("deviceType"),
                fields.getFirst("powersOn"),
                fields.getFirst("condition"),
                fields.getFirst("physicalDamage"),
                fields.getFirst("preference")
        );
        return service.submitSurvey(request, image, service.requireUserId(authorization));
    }

    @GetMapping("/analyses/{id}")
    public Map<String, Object> getAnalysis(
            @PathVariable String id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return service.getAnalysis(id, service.requireUserId(authorization));
    }

    @GetMapping("/analyses/{id}/image")
    public ResponseEntity<byte[]> getAnalysisImage(
            @PathVariable String id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        StoredImage image = service.getAnalysisImage(id, service.resolveUserId(authorization));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(image.bytes());
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return service.getDashboard(service.requireUserId(authorization));
    }

    @PostMapping("/pickups")
    public Map<String, Object> schedulePickup(
            @RequestBody PickupRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return service.schedulePickup(request, service.requireUserId(authorization));
    }
}
