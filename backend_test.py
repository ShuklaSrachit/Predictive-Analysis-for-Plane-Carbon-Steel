#!/usr/bin/env python3
"""
Backend API Testing for Steel Microstructure Prediction Framework
Tests all endpoints with comprehensive validation
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, List

class SteelMicrostructureAPITester:
    def __init__(self, base_url="https://ferrite-predict.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")

    def test_api_status(self) -> bool:
        """Test API operational status"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_fields = ["message", "status"]
                has_fields = all(field in data for field in expected_fields)
                success = has_fields and data.get("status") == "operational"
                
                self.log_test(
                    "API Status Check", 
                    success,
                    f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}"
                )
            else:
                self.log_test(
                    "API Status Check", 
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
            
            return success
            
        except Exception as e:
            self.log_test("API Status Check", False, f"Connection error: {str(e)}")
            return False

    def test_prediction_endpoint(self) -> Dict[str, Any]:
        """Test prediction endpoint with valid inputs"""
        test_data = {
            "carbon_content": 0.45,
            "austenitizing_temp": 850,
            "holding_time": 30,
            "cooling_rate": 10.0,
            "heat_treatment": "normalizing"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/predict", 
                json=test_data,
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                # Validate required output fields
                required_fields = [
                    "grain_size_astm", "ferrite_fraction", "pearlite_fraction", 
                    "cementite_fraction", "grain_classification", "regime", "confidence"
                ]
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    self.log_test(
                        "Prediction Endpoint - Field Validation",
                        False,
                        f"Missing fields: {missing_fields}",
                        data
                    )
                else:
                    # Validate data types and ranges
                    validation_errors = []
                    
                    if not isinstance(data.get("grain_size_astm"), (int, float)) or data["grain_size_astm"] <= 0:
                        validation_errors.append("grain_size_astm should be positive number")
                    
                    for fraction_field in ["ferrite_fraction", "pearlite_fraction", "cementite_fraction"]:
                        value = data.get(fraction_field)
                        if not isinstance(value, (int, float)) or value < 0 or value > 100:
                            validation_errors.append(f"{fraction_field} should be 0-100")
                    
                    if data.get("grain_classification") not in ["Fine", "Coarse"]:
                        validation_errors.append("grain_classification should be 'Fine' or 'Coarse'")
                    
                    if data.get("regime") not in ["Hypoeutectoid", "Eutectoid", "Hypereutectoid", "Cementite-Dominant"]:
                        validation_errors.append("Invalid regime value")
                    
                    confidence = data.get("confidence")
                    if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                        validation_errors.append("confidence should be 0-1")
                    
                    if validation_errors:
                        success = False
                        self.log_test(
                            "Prediction Endpoint - Data Validation",
                            False,
                            f"Validation errors: {validation_errors}",
                            data
                        )
                    else:
                        self.log_test(
                            "Prediction Endpoint - Success",
                            True,
                            f"Regime: {data['regime']}, Grain Size: {data['grain_size_astm']}, Confidence: {data['confidence']:.2f}"
                        )
                        return data
            else:
                self.log_test(
                    "Prediction Endpoint",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test("Prediction Endpoint", False, f"Request error: {str(e)}")
            
        return {}

    def test_prediction_history(self) -> List[Dict]:
        """Test prediction history endpoint"""
        try:
            response = requests.get(f"{self.api_url}/predictions", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_test(
                        "Prediction History",
                        True,
                        f"Retrieved {len(data)} predictions"
                    )
                    return data
                else:
                    self.log_test(
                        "Prediction History",
                        False,
                        "Response should be a list",
                        data
                    )
            else:
                self.log_test(
                    "Prediction History",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_test("Prediction History", False, f"Request error: {str(e)}")
            
        return []

    def test_delete_prediction(self, prediction_id: str) -> bool:
        """Test delete specific prediction"""
        try:
            response = requests.delete(f"{self.api_url}/predictions/{prediction_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = "message" in data and "deleted" in data["message"].lower()
                
            self.log_test(
                "Delete Prediction",
                success,
                f"Deleted prediction {prediction_id}" if success else f"Status: {response.status_code}"
            )
            
            return success
            
        except Exception as e:
            self.log_test("Delete Prediction", False, f"Request error: {str(e)}")
            return False

    def test_phase_diagram_data(self) -> bool:
        """Test phase diagram data endpoint"""
        try:
            response = requests.get(f"{self.api_url}/phase-diagram-data", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                # Validate required structure
                required_keys = ["phase_boundaries", "key_points", "phase_regions", "steel_range", "temperature_range"]
                missing_keys = [key for key in required_keys if key not in data]
                
                if missing_keys:
                    success = False
                    self.log_test(
                        "Phase Diagram Data",
                        False,
                        f"Missing keys: {missing_keys}",
                        data
                    )
                else:
                    # Validate steel range
                    steel_range = data.get("steel_range", {})
                    if steel_range.get("min") != 0.05 or steel_range.get("max") != 2.1:
                        success = False
                        self.log_test(
                            "Phase Diagram Data",
                            False,
                            f"Invalid steel range: {steel_range}"
                        )
                    else:
                        self.log_test(
                            "Phase Diagram Data",
                            True,
                            f"Retrieved phase diagram with {len(data.get('key_points', []))} key points"
                        )
            else:
                self.log_test(
                    "Phase Diagram Data",
                    False,
                    f"Expected 200, got {response.status_code}",
                    response.text
                )
                
            return success
            
        except Exception as e:
            self.log_test("Phase Diagram Data", False, f"Request error: {str(e)}")
            return False

    def test_regime_info(self) -> bool:
        """Test regime info endpoints"""
        regimes = ["Hypoeutectoid", "Eutectoid", "Hypereutectoid", "Cementite-Dominant"]
        all_success = True
        
        for regime in regimes:
            try:
                response = requests.get(f"{self.api_url}/regime-info/{regime}", timeout=10)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    
                    # Validate required fields
                    required_fields = ["regime", "carbon_range", "description", "properties", "applications", "phase_distribution"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        success = False
                        self.log_test(
                            f"Regime Info - {regime}",
                            False,
                            f"Missing fields: {missing_fields}",
                            data
                        )
                    else:
                        self.log_test(
                            f"Regime Info - {regime}",
                            True,
                            f"Carbon range: {data['carbon_range']}"
                        )
                else:
                    success = False
                    self.log_test(
                        f"Regime Info - {regime}",
                        False,
                        f"Expected 200, got {response.status_code}",
                        response.text
                    )
                
                if not success:
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Regime Info - {regime}", False, f"Request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_specific_requirements(self) -> bool:
        """Test specific requirements from review request"""
        all_passed = True
        
        # Test 1: POST /api/predict with normalizing returns all fields including mechanical properties
        normalizing_data = {
            "carbon_content": 0.45,
            "manganese_content": 0.65,
            "silicon_content": 0.25,
            "austenitizing_temp": 850,
            "holding_time": 30,
            "cooling_rate": 10,
            "heat_treatment": "normalizing"
        }
        
        try:
            response = requests.post(f"{self.api_url}/predict", json=normalizing_data, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                mechanical_fields = ["yield_strength", "tensile_strength", "hardness", "elongation"]
                missing_fields = [field for field in mechanical_fields if field not in data]
                
                if not missing_fields:
                    self.log_test(
                        "Normalizing - All Mechanical Properties",
                        True,
                        f"YS: {data['yield_strength']}, TS: {data['tensile_strength']}, HV: {data['hardness']}, El: {data['elongation']}"
                    )
                else:
                    success = False
                    all_passed = False
                    self.log_test("Normalizing - All Mechanical Properties", False, f"Missing: {missing_fields}")
            else:
                all_passed = False
                self.log_test("Normalizing - All Mechanical Properties", False, f"Status: {response.status_code}")
        except Exception as e:
            all_passed = False
            self.log_test("Normalizing - All Mechanical Properties", False, f"Error: {str(e)}")
        
        # Test 2: POST /api/predict with quenching returns martensite > 0
        quenching_data = {
            "carbon_content": 0.6,
            "manganese_content": 0.8,
            "silicon_content": 0.3,
            "austenitizing_temp": 900,
            "holding_time": 45,
            "cooling_rate": 100,
            "heat_treatment": "quenching"
        }
        
        try:
            response = requests.post(f"{self.api_url}/predict", json=quenching_data, timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                martensite = data.get("martensite_fraction", 0)
                if martensite > 0:
                    self.log_test("Quenching - Martensite Formation", True, f"Martensite: {martensite}%")
                else:
                    success = False
                    all_passed = False
                    self.log_test("Quenching - Martensite Formation", False, f"Martensite: {martensite}% (should be > 0)")
            else:
                all_passed = False
                self.log_test("Quenching - Martensite Formation", False, f"Status: {response.status_code}")
        except Exception as e:
            all_passed = False
            self.log_test("Quenching - Martensite Formation", False, f"Error: {str(e)}")
        
        # Test 3: POST /api/predict with annealing and cooling_rate > 1 returns 400 error
        invalid_annealing_data = {
            "carbon_content": 0.3,
            "manganese_content": 0.5,
            "silicon_content": 0.2,
            "austenitizing_temp": 800,
            "holding_time": 60,
            "cooling_rate": 5.0,  # Invalid for annealing (> 1.0)
            "heat_treatment": "annealing"
        }
        
        try:
            response = requests.post(f"{self.api_url}/predict", json=invalid_annealing_data, timeout=10)
            success = response.status_code == 400
            
            if success:
                error_msg = response.json().get("detail", "")
                self.log_test("Annealing Cooling Rate Constraint", True, f"Error: {error_msg}")
            else:
                all_passed = False
                self.log_test("Annealing Cooling Rate Constraint", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            all_passed = False
            self.log_test("Annealing Cooling Rate Constraint", False, f"Error: {str(e)}")
        
        # Test 4: POST /api/predict with quenching and cooling_rate < 50 returns 400 error
        invalid_quenching_data = {
            "carbon_content": 0.8,
            "manganese_content": 0.7,
            "silicon_content": 0.25,
            "austenitizing_temp": 850,
            "holding_time": 30,
            "cooling_rate": 20.0,  # Invalid for quenching (< 50)
            "heat_treatment": "quenching"
        }
        
        try:
            response = requests.post(f"{self.api_url}/predict", json=invalid_quenching_data, timeout=10)
            success = response.status_code == 400
            
            if success:
                error_msg = response.json().get("detail", "")
                self.log_test("Quenching Cooling Rate Constraint", True, f"Error: {error_msg}")
            else:
                all_passed = False
                self.log_test("Quenching Cooling Rate Constraint", False, f"Expected 400, got {response.status_code}")
        except Exception as e:
            all_passed = False
            self.log_test("Quenching Cooling Rate Constraint", False, f"Error: {str(e)}")
        
        return all_passed

    def test_cooling_rate_ranges(self) -> bool:
        """Test cooling rate range endpoints"""
        expected_ranges = {
            "annealing": {"min": 0.01, "max": 1.0},
            "normalizing": {"min": 5, "max": 20},
            "quenching": {"min": 50, "max": 200}
        }
        
        all_passed = True
        
        for ht, expected in expected_ranges.items():
            try:
                response = requests.get(f"{self.api_url}/cooling-rate-range/{ht}", timeout=10)
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    if data.get("min") == expected["min"] and data.get("max") == expected["max"]:
                        self.log_test(f"Cooling Rate Range - {ht}", True, f"Min: {data['min']}, Max: {data['max']}")
                    else:
                        success = False
                        all_passed = False
                        self.log_test(f"Cooling Rate Range - {ht}", False, f"Expected {expected}, got {data}")
                else:
                    all_passed = False
                    self.log_test(f"Cooling Rate Range - {ht}", False, f"Status: {response.status_code}")
            except Exception as e:
                all_passed = False
                self.log_test(f"Cooling Rate Range - {ht}", False, f"Error: {str(e)}")
        
        return all_passed

    def test_invalid_inputs(self) -> bool:
        """Test API with invalid inputs"""
        invalid_cases = [
            {
                "name": "Invalid Carbon Content",
                "data": {
                    "carbon_content": -0.5,  # Invalid: negative
                    "austenitizing_temp": 850,
                    "holding_time": 30,
                    "cooling_rate": 10.0,
                    "heat_treatment": "normalizing"
                }
            },
            {
                "name": "Invalid Heat Treatment",
                "data": {
                    "carbon_content": 0.45,
                    "austenitizing_temp": 850,
                    "holding_time": 30,
                    "cooling_rate": 10.0,
                    "heat_treatment": "invalid_treatment"
                }
            },
            {
                "name": "Missing Required Field",
                "data": {
                    "carbon_content": 0.45,
                    "austenitizing_temp": 850,
                    # Missing holding_time
                    "cooling_rate": 10.0,
                    "heat_treatment": "normalizing"
                }
            }
        ]
        
        all_handled = True
        
        for case in invalid_cases:
            try:
                response = requests.post(
                    f"{self.api_url}/predict",
                    json=case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                # Should return 4xx error for invalid input
                success = 400 <= response.status_code < 500
                
                self.log_test(
                    f"Invalid Input - {case['name']}",
                    success,
                    f"Status: {response.status_code} (Expected 4xx for invalid input)"
                )
                
                if not success:
                    all_handled = False
                    
            except Exception as e:
                self.log_test(f"Invalid Input - {case['name']}", False, f"Request error: {str(e)}")
                all_handled = False
        
        return all_handled

    def run_all_tests(self) -> Dict[str, Any]:
        """Run comprehensive test suite"""
        print("🧪 Starting Steel Microstructure API Test Suite")
        print("=" * 60)
        
        # Test API status first
        if not self.test_api_status():
            print("\n❌ API is not operational. Stopping tests.")
            return self.get_summary()
        
        # Test specific requirements from review request
        self.test_specific_requirements()
        
        # Test cooling rate ranges
        self.test_cooling_rate_ranges()
        
        # Test core prediction functionality
        prediction_data = self.test_prediction_endpoint()
        
        # Test history functionality
        history_data = self.test_prediction_history()
        
        # Test delete functionality if we have predictions
        if history_data and len(history_data) > 0:
            # Delete the first prediction to test delete functionality
            first_prediction_id = history_data[0].get("id")
            if first_prediction_id:
                self.test_delete_prediction(first_prediction_id)
        
        # Test phase diagram data
        self.test_phase_diagram_data()
        
        # Test regime info endpoints
        self.test_regime_info()
        
        # Test error handling
        self.test_invalid_inputs()
        
        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        summary = {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": round(success_rate, 1),
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat()
        }
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_run - self.tests_passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test_name']}: {result['details']}")
        
        return summary

def main():
    """Main test execution"""
    tester = SteelMicrostructureAPITester()
    summary = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if summary["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())