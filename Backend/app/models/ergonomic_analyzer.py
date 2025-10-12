import numpy as np
import math

class ErgonomicAnalyzer:
    """
    RULA (Rapid Upper Limb Assessment) and REBA (Rapid Entire Body Assessment)
    for construction worker posture analysis
    """
    
    def __init__(self):
        self.joint_connections = [
            (11, 13), (13, 15),  # Left arm
            (12, 14), (14, 16),  # Right arm
            (11, 12),            # Shoulders
            (11, 23), (12, 24),  # Torso
            (23, 25), (25, 27),  # Left leg
            (24, 26), (26, 28),  # Right leg
        ]
    
    def calculate_angle(self, p1, p2, p3):
        """Calculate angle between three points"""
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
        return math.degrees(angle)
    
    def calculate_rula_score(self, landmarks):
        """
        Calculate RULA score (1-7 scale)
        Based on upper body posture analysis
        """
        if not landmarks or len(landmarks) < 33:
            return None, "Insufficient landmarks"
        
        # Extract key points (MediaPipe pose landmarks)
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_elbow = landmarks[13]
        right_elbow = landmarks[14]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        
        # Upper Arm Score (1-6)
        # Calculate shoulder flexion/extension
        left_arm_angle = self.calculate_angle(
            [left_shoulder['x'], left_shoulder['y']],
            [left_elbow['x'], left_elbow['y']],
            [left_wrist['x'], left_wrist['y']]
        )
        
        upper_arm_score = 1
        if left_arm_angle < 20:
            upper_arm_score = 2
        elif left_arm_angle < 45:
            upper_arm_score = 3
        elif left_arm_angle < 90:
            upper_arm_score = 4
        else:
            upper_arm_score = 5
        
        # Lower Arm Score (1-3)
        lower_arm_score = 1
        if 60 < left_arm_angle < 100:
            lower_arm_score = 1
        else:
            lower_arm_score = 2
        
        # Wrist Score (1-4)
        wrist_score = 2  # Neutral position
        
        # Neck Score (1-6)
        nose = landmarks[0]
        neck = landmarks[11]  # Approximation
        neck_angle = abs(nose['y'] - neck['y'])
        
        neck_score = 1
        if neck_angle > 0.2:
            neck_score = 3
        elif neck_angle > 0.1:
            neck_score = 2
        
        # Trunk Score (1-6)
        hip_center = {
            'x': (landmarks[23]['x'] + landmarks[24]['x']) / 2,
            'y': (landmarks[23]['y'] + landmarks[24]['y']) / 2
        }
        shoulder_center = {
            'x': (left_shoulder['x'] + right_shoulder['x']) / 2,
            'y': (left_shoulder['y'] + right_shoulder['y']) / 2
        }
        
        trunk_angle = abs(shoulder_center['y'] - hip_center['y'])
        trunk_score = 2 if trunk_angle > 0.15 else 1
        
        # Calculate final RULA score (simplified)
        rula_score = (upper_arm_score + lower_arm_score + wrist_score + 
                      neck_score + trunk_score) / 5
        
        # Normalize to 1-7 scale
        final_score = min(7, max(1, int(rula_score * 2)))
        
        risk_level = self._get_risk_level(final_score)
        
        return final_score, risk_level
    
    def calculate_reba_score(self, landmarks):
        """
        Calculate REBA score (1-15 scale)
        Includes full body assessment
        """
        if not landmarks or len(landmarks) < 33:
            return None, "Insufficient landmarks"
        
        # Extract key points
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]
        
        # Leg score (1-4)
        left_leg_angle = self.calculate_angle(
            [left_hip['x'], left_hip['y']],
            [left_knee['x'], left_knee['y']],
            [left_ankle['x'], left_ankle['y']]
        )
        
        leg_score = 1
        if left_leg_angle < 30:
            leg_score = 2
        elif left_leg_angle < 60:
            leg_score = 3
        else:
            leg_score = 4
        
        # Get RULA components
        rula_score, _ = self.calculate_rula_score(landmarks)
        if rula_score is None:
            return None, "Cannot calculate REBA"
        
        # Combine for REBA (simplified calculation)
        reba_score = min(15, max(1, int((rula_score * 1.5 + leg_score) / 2 * 3)))
        
        risk_level = self._get_reba_risk_level(reba_score)
        
        return reba_score, risk_level
    
    def _get_risk_level(self, rula_score):
        """Get risk level from RULA score"""
        if rula_score <= 2:
            return "Acceptable"
        elif rula_score <= 4:
            return "Investigate Further"
        elif rula_score <= 6:
            return "Investigate and Change Soon"
        else:
            return "Investigate and Change Immediately"
    
    def _get_reba_risk_level(self, reba_score):
        """Get risk level from REBA score"""
        if reba_score == 1:
            return "Negligible Risk"
        elif reba_score <= 3:
            return "Low Risk"
        elif reba_score <= 7:
            return "Medium Risk"
        elif reba_score <= 10:
            return "High Risk"
        else:
            return "Very High Risk"
    
    def analyze_posture(self, landmarks):
        """Complete posture analysis"""
        rula_score, rula_risk = self.calculate_rula_score(landmarks)
        reba_score, reba_risk = self.calculate_reba_score(landmarks)
        
        return {
            "rula": {
                "score": rula_score,
                "risk_level": rula_risk
            },
            "reba": {
                "score": reba_score,
                "risk_level": reba_risk
            }
        }