// Class ID constants
export const CLASS_IDS = {
  HARDHAT: 0,
  MASK: 1,
  NO_HARDHAT: 2,
  NO_MASK: 3,
  NO_SAFETY_VEST: 4,
  PERSON: 5,
  SAFETY_CONE: 6,
  SAFETY_VEST: 7,
  MACHINERY: 8,
  UTILITY_POLE: 9,
  VEHICLE: 10,
};

// Extract counts from detections array
export function getDetectionCounts(detections) {
  if (!detections || !Array.isArray(detections)) {
    return {
      personCount: 0,
      hardhatCount: 0,
      maskCount: 0,
      vestCount: 0,
      noHardhatCount: 0,
      noMaskCount: 0,
      noVestCount: 0,
    };
  }

  return {
    personCount: detections.filter(d => d.class_id === CLASS_IDS.PERSON).length,
    hardhatCount: detections.filter(d => d.class_id === CLASS_IDS.HARDHAT).length,
    maskCount: detections.filter(d => d.class_id === CLASS_IDS.MASK).length,
    vestCount: detections.filter(d => d.class_id === CLASS_IDS.SAFETY_VEST).length,
    noHardhatCount: detections.filter(d => d.class_id === CLASS_IDS.NO_HARDHAT).length,
    noMaskCount: detections.filter(d => d.class_id === CLASS_IDS.NO_MASK).length,
    noVestCount: detections.filter(d => d.class_id === CLASS_IDS.NO_SAFETY_VEST).length,
  };
}

// Check if there are PPE violations
export function getPPEViolations(detections) {
  const counts = getDetectionCounts(detections);
  const violations = [];

  if (counts.noHardhatCount > 0) {
    violations.push({
      type: 'hardhat',
      count: counts.noHardhatCount,
      message: `${counts.noHardhatCount} worker(s) without hardhat`,
    });
  }

  if (counts.noMaskCount > 0) {
    violations.push({
      type: 'mask',
      count: counts.noMaskCount,
      message: `${counts.noMaskCount} worker(s) without mask`,
    });
  }

  if (counts.noVestCount > 0) {
    violations.push({
      type: 'vest',
      count: counts.noVestCount,
      message: `${counts.noVestCount} worker(s) without safety vest`,
    });
  }

  return violations;
}