import { RiskLevel } from '@prisma/client'
import { scoreToRiskLevel, RISK_THRESHOLDS } from 'src/domains/risk/risk.config'

describe('risk.config', () => {
  it('has thresholds ordered from high to low', () => {
    for (let i = 1; i < RISK_THRESHOLDS.length; i++) {
      expect(RISK_THRESHOLDS[i - 1].minScore).toBeGreaterThanOrEqual(RISK_THRESHOLDS[i].minScore)
    }
  })

  it('maps score to correct risk level boundaries', () => {
    expect(scoreToRiskLevel(0)).toBe(RiskLevel.LOW)
    expect(scoreToRiskLevel(19)).toBe(RiskLevel.LOW)
    expect(scoreToRiskLevel(20)).toBe(RiskLevel.MEDIUM)
    expect(scoreToRiskLevel(49)).toBe(RiskLevel.MEDIUM)
    expect(scoreToRiskLevel(50)).toBe(RiskLevel.HIGH)
    expect(scoreToRiskLevel(79)).toBe(RiskLevel.HIGH)
    expect(scoreToRiskLevel(80)).toBe(RiskLevel.CRITICAL)
    expect(scoreToRiskLevel(999)).toBe(RiskLevel.CRITICAL)
  })
})
