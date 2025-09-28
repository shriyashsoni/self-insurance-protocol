-- SelfTravel Protocol - Seed Travel Data
-- This script seeds the database with sample travel credentials and policies

-- Insert sample travel credential types and issuers
INSERT INTO travel_credentials (user_id, credential_type, credential_data, issuer_did, proof_signature, verification_status, issued_at, expires_at) VALUES
-- Sample passport credential (using a placeholder user_id - will be replaced with actual user IDs)
(
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'passport',
    '{
        "document_number": "P***1234",
        "country": "US",
        "nationality": "US",
        "age_over_18": true,
        "age_over_21": true,
        "document_type": "passport",
        "issuing_authority": "US State Department"
    }',
    'did:self:passport_authority_us',
    'proof_passport_sample_123',
    'verified',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '10 years'
),
-- Sample travel pass credential
(
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'travel_pass',
    '{
        "verified_traveler": true,
        "ofac_clear": true,
        "kyc_level": "full",
        "travel_score": 95,
        "frequent_traveler": true,
        "trusted_traveler_programs": ["Global Entry", "TSA PreCheck"]
    }',
    'did:self:selftravel_protocol',
    'proof_travel_pass_sample_456',
    'verified',
    NOW() - INTERVAL '7 days',
    NOW() + INTERVAL '2 years'
);

-- Insert sample travel policies with 0.1 ETH showcase values
INSERT INTO travel_policies (user_id, policy_type, policy_name, premium_amount_eth, coverage_amount_eth, policy_terms, oracle_conditions, required_credentials, start_date, end_date) VALUES
(
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'travel',
    'Travel Delay Protection Showcase',
    0.01, -- 0.01 ETH premium
    0.1,  -- 0.1 ETH coverage
    '{
        "conditions": ["Flight delay > 2 hours", "Train/bus delay > 1 hour", "Weather-related cancellations"],
        "duration": "1 trip",
        "region": "Global",
        "coverage_details": "Automatic payout for verified delays"
    }',
    '{
        "type": "travel_delay",
        "triggers": ["flight_delay", "weather_cancellation", "mechanical_issues"],
        "thresholds": {
            "flight_delay_minutes": 120,
            "weather_severity": "severe",
            "mechanical_delay_minutes": 60
        },
        "oracle_sources": ["FlightAware API", "Weather.gov", "Airline APIs"]
    }',
    '["passport", "travel_pass"]',
    NOW(),
    NOW() + INTERVAL '30 days'
),
(
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'medical',
    'Travel Medical Emergency Showcase',
    0.015, -- 0.015 ETH premium
    0.1,   -- 0.1 ETH coverage
    '{
        "conditions": ["Emergency hospitalization", "Medical evacuation", "Prescription coverage"],
        "duration": "30 days",
        "region": "Worldwide",
        "coverage_details": "Emergency medical expenses while traveling"
    }',
    '{
        "type": "medical_emergency",
        "triggers": ["hospitalization", "emergency_treatment", "medical_evacuation"],
        "thresholds": {
            "minimum_treatment_cost": 500,
            "emergency_severity": "high",
            "evacuation_distance_km": 100
        },
        "oracle_sources": ["Medical Provider APIs", "Insurance Networks", "Emergency Services"]
    }',
    '["passport", "travel_pass"]',
    NOW(),
    NOW() + INTERVAL '30 days'
),
(
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'baggage',
    'Baggage Protection Showcase',
    0.005, -- 0.005 ETH premium
    0.1,   -- 0.1 ETH coverage
    '{
        "conditions": ["Baggage delay > 12 hours", "Lost or stolen items", "Damaged luggage coverage"],
        "duration": "1 trip",
        "region": "Global",
        "coverage_details": "Protection for baggage delays, loss, and damage"
    }',
    '{
        "type": "baggage_protection",
        "triggers": ["baggage_delay", "baggage_loss", "baggage_damage"],
        "thresholds": {
            "delay_hours": 12,
            "loss_confirmation_hours": 24,
            "damage_assessment": "moderate"
        },
        "oracle_sources": ["Airline Baggage APIs", "Airport Systems", "Baggage Tracking"]
    }',
    '["passport"]',
    NOW(),
    NOW() + INTERVAL '14 days'
);

-- Insert sample verification sessions
INSERT INTO travel_verification_sessions (session_id, user_id, verification_type, status, required_claims, verified_claims, started_at, completed_at) VALUES
(
    'session_sample_completed_123',
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'travel_identity',
    'completed',
    '["identity.passport", "identity.age_over_18", "compliance.ofac_clear"]',
    '{
        "identity.passport": true,
        "identity.age_over_18": true,
        "identity.country_of_residence": "US",
        "compliance.ofac_clear": true,
        "travel.frequent_traveler": true
    }',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
),
(
    'session_sample_pending_456',
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'travel_identity',
    'pending',
    '["identity.passport", "identity.age_over_18", "compliance.ofac_clear"]',
    '{}',
    NOW() - INTERVAL '10 minutes',
    NULL
);

-- Insert sample credential presentations (audit trail)
INSERT INTO credential_presentations (credential_id, user_id, verifier_did, verifier_name, presentation_data, selective_disclosure, verification_result, location, purpose) VALUES
(
    (SELECT id FROM travel_credentials WHERE credential_type = 'passport' LIMIT 1),
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'did:verifier:airport_security_jfk',
    'JFK Airport Security',
    '{
        "presentation_type": "selective_disclosure",
        "requested_claims": ["age_over_18", "nationality", "document_validity"],
        "presentation_method": "qr_code"
    }',
    '{
        "age_over_18": true,
        "nationality": "US",
        "document_validity": true
    }',
    true,
    'JFK Airport, New York',
    'Airport security checkpoint'
),
(
    (SELECT id FROM travel_credentials WHERE credential_type = 'travel_pass' LIMIT 1),
    '00000000-0000-0000-0000-000000000000', -- Placeholder user_id
    'did:verifier:hotel_checkin_marriott',
    'Marriott Hotel Check-in',
    '{
        "presentation_type": "full_credential",
        "requested_claims": ["verified_traveler", "kyc_level"],
        "presentation_method": "wallet_connect"
    }',
    '{
        "verified_traveler": true,
        "kyc_level": "full",
        "travel_score": 95
    }',
    true,
    'Marriott Hotel, Manhattan',
    'Hotel check-in verification'
);

-- Note: In production, the placeholder user_id values should be replaced with actual user IDs
-- This can be done through application logic or additional migration scripts
