-- Seed initial oracle data for testing
INSERT INTO public.oracle_data (oracle_type, data_feed, data_value, timestamp) VALUES
('chainlink', 'flight_status', '{"flightNumber": "AA1234", "status": "on-time", "delayMinutes": 0}', NOW()),
('chainlink', 'weather_data', '{"location": "New York", "temperature": 22, "rainfall": 5.2, "windSpeed": 15}', NOW()),
('pyth', 'price_feed', '{"symbol": "BTC/USD", "price": 45250.50, "confidence": 0.005}', NOW()),
('chainlink', 'flight_status', '{"flightNumber": "UA5678", "status": "delayed", "delayMinutes": 145}', NOW() - INTERVAL '1 hour'),
('chainlink', 'weather_data', '{"location": "Miami", "temperature": 28, "rainfall": 0.1, "windSpeed": 85}', NOW() - INTERVAL '30 minutes'),
('pyth', 'price_feed', '{"symbol": "ETH/USD", "price": 2845.75, "confidence": 0.003}', NOW() - INTERVAL '15 minutes');
