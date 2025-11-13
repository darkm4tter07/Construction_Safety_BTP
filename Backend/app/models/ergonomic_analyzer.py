import math

class ErgonomicAnalyzer:
    """
    Analyzes posture using RULA (Rapid Upper Limb Assessment) 
    and REBA (Rapid Entire Body Assessment) scores.
    """
    
    def __init__(self):
        # MediaPipe landmark indices
        self.NOSE = 0
        self.LEFT_SHOULDER = 11
        self.RIGHT_SHOULDER = 12
        self.LEFT_ELBOW = 13
        self.RIGHT_ELBOW = 14
        self.LEFT_WRIST = 15
        self.RIGHT_WRIST = 16
        self.LEFT_HIP = 23
        self.RIGHT_HIP = 24
        self.LEFT_KNEE = 25
        self.RIGHT_KNEE = 26
        self.LEFT_ANKLE = 27
        self.RIGHT_ANKLE = 28

    def analyze_posture(self, landmarks):
        """
        Main function to analyze posture and return RULA/REBA scores.
        
        Args:
            landmarks: List of dicts with keys 'x', 'y', 'z', 'visibility'
        
        Returns:
            dict with 'rula' and 'reba' scores
        """
        if not landmarks or len(landmarks) < 33:
            return None
        
        try:
            rula_score = self._calculate_rula(landmarks)
            reba_score = self._calculate_reba(landmarks)
            
            return {
                "rula": {
                    "score": rula_score,
                    "risk": self._get_rula_risk(rula_score)
                },
                "reba": {
                    "score": reba_score,
                    "risk": self._get_reba_risk(reba_score)
                }
            }
        except Exception as e:
            print(f"Error in posture analysis: {e}")
            return None

    def _calculate_rula(self, landmarks):
        """
        Simplified RULA score calculation (1-7 scale)
        Focuses on upper body: arms, wrists, neck
        """
        # Upper arm angle (shoulder to elbow)
        upper_arm_score = self._score_upper_arm(landmarks)
        
        # Lower arm angle (elbow to wrist)
        lower_arm_score = self._score_lower_arm(landmarks)
        
        # Wrist position
        wrist_score = self._score_wrist(landmarks)
        
        # Neck position
        neck_score = self._score_neck(landmarks)
        
        # Combine scores (simplified RULA table)
        # In real RULA, you'd use lookup tables
        posture_score = (upper_arm_score + lower_arm_score + wrist_score + neck_score) / 4
        
        # Map to 1-7 scale
        rula_score = min(7, max(1, int(posture_score * 2)))
        return rula_score

    def _calculate_reba(self, landmarks):
        """
        Simplified REBA score calculation (1-15 scale)
        Focuses on whole body: trunk, neck, legs
        """
        # Trunk (torso) posture
        trunk_score = self._score_trunk(landmarks)
        
        # Neck posture
        neck_score = self._score_neck(landmarks)
        
        # Leg posture
        leg_score = self._score_legs(landmarks)
        
        # Upper limb score
        upper_limb_score = (self._score_upper_arm(landmarks) + self._score_lower_arm(landmarks)) / 2
        
        # Combine scores (simplified REBA table)
        posture_score = (trunk_score * 1.5 + neck_score + leg_score + upper_limb_score) / 4
        
        # Map to 1-15 scale
        reba_score = min(15, max(1, int(posture_score * 3)))
        return reba_score

    # ============ SCORING FUNCTIONS ============
    
    def _score_upper_arm(self, landmarks):
        """Score upper arm position (1-4)"""
        left_shoulder = landmarks[self.LEFT_SHOULDER]
        left_elbow = landmarks[self.LEFT_ELBOW]
        
        # Calculate angle from vertical
        angle = self._calculate_angle_vertical(left_shoulder, left_elbow)
        
        if angle < 20:
            return 1
        elif angle < 45:
            return 2
        elif angle < 90:
            return 3
        else:
            return 4

    def _score_lower_arm(self, landmarks):
        """Score lower arm position (1-3)"""
        left_elbow = landmarks[self.LEFT_ELBOW]
        left_wrist = landmarks[self.LEFT_WRIST]
        left_shoulder = landmarks[self.LEFT_SHOULDER]
        
        # Calculate elbow angle
        angle = self._calculate_joint_angle(left_shoulder, left_elbow, left_wrist)
        
        if 60 <= angle <= 100:
            return 1  # Good position
        elif angle < 60 or angle > 120:
            return 3  # Extreme position
        else:
            return 2  # Moderate

    def _score_wrist(self, landmarks):
        """Score wrist position (1-3)"""
        wrist = landmarks[self.LEFT_WRIST]
        elbow = landmarks[self.LEFT_ELBOW]
        
        # Check if wrist is bent (deviation from elbow-wrist line)
        deviation = abs(wrist['y'] - elbow['y']) * 100
        
        if deviation < 5:
            return 1  # Neutral
        elif deviation < 15:
            return 2  # Moderate bend
        else:
            return 3  # Extreme bend

    def _score_neck(self, landmarks):
        """Score neck position (1-4)"""
        nose = landmarks[self.NOSE]
        left_shoulder = landmarks[self.LEFT_SHOULDER]
        right_shoulder = landmarks[self.RIGHT_SHOULDER]
        
        # Calculate neck forward lean
        shoulder_mid_y = (left_shoulder['y'] + right_shoulder['y']) / 2
        neck_forward = (nose['y'] - shoulder_mid_y) * 100
        
        if abs(neck_forward) < 10:
            return 1  # Upright
        elif abs(neck_forward) < 20:
            return 2  # Slight bend
        elif abs(neck_forward) < 40:
            return 3  # Moderate bend
        else:
            return 4  # Extreme bend

    def _score_trunk(self, landmarks):
        """Score trunk/torso position (1-5)"""
        left_shoulder = landmarks[self.LEFT_SHOULDER]
        left_hip = landmarks[self.LEFT_HIP]
        
        # Calculate trunk lean from vertical
        angle = self._calculate_angle_vertical(left_hip, left_shoulder)
        
        if angle < 5:
            return 1  # Upright
        elif angle < 20:
            return 2  # Slight bend
        elif angle < 60:
            return 3  # Moderate bend
        elif angle < 90:
            return 4  # Severe bend
        else:
            return 5  # Extreme bend

    def _score_legs(self, landmarks):
        """Score leg position (1-4)"""
        left_hip = landmarks[self.LEFT_HIP]
        left_knee = landmarks[self.LEFT_KNEE]
        left_ankle = landmarks[self.LEFT_ANKLE]
        
        # Calculate knee angle
        angle = self._calculate_joint_angle(left_hip, left_knee, left_ankle)
        
        # Check if legs are bent (sitting/kneeling)
        if angle > 150:
            return 1  # Standing straight
        elif angle > 90:
            return 2  # Slightly bent
        elif angle > 60:
            return 3  # Sitting/kneeling
        else:
            return 4  # Extreme position

    # ============ HELPER FUNCTIONS ============
    
    def _calculate_angle_vertical(self, point1, point2):
        """Calculate angle from vertical (in degrees)"""
        dx = point2['x'] - point1['x']
        dy = point2['y'] - point1['y']
        angle = abs(math.degrees(math.atan2(dx, dy)))
        return angle

    def _calculate_joint_angle(self, point1, point2, point3):
        """Calculate angle at point2 formed by point1-point2-point3"""
        # Vector from point2 to point1
        v1x = point1['x'] - point2['x']
        v1y = point1['y'] - point2['y']
        
        # Vector from point2 to point3
        v2x = point3['x'] - point2['x']
        v2y = point3['y'] - point2['y']
        
        # Calculate angle using dot product
        dot = v1x * v2x + v1y * v2y
        mag1 = math.sqrt(v1x**2 + v1y**2)
        mag2 = math.sqrt(v2x**2 + v2y**2)
        
        if mag1 == 0 or mag2 == 0:
            return 0
        
        cos_angle = dot / (mag1 * mag2)
        cos_angle = max(-1, min(1, cos_angle))  # Clamp to [-1, 1]
        angle = math.degrees(math.acos(cos_angle))
        
        return angle

    # ============ RISK LEVEL FUNCTIONS ============
    
    def _get_rula_risk(self, score):
        """Get risk level for RULA score"""
        if score <= 2:
            return "Acceptable"
        elif score <= 4:
            return "Investigate"
        elif score <= 6:
            return "Investigate Soon"
        else:
            return "Investigate Now"

    def _get_reba_risk(self, score):
        """Get risk level for REBA score"""
        if score <= 3:
            return "Negligible"
        elif score <= 7:
            return "Low"
        elif score <= 10:
            return "Medium"
        elif score <= 14:
            return "High"
        else:
            return "Very High"