import { describe, it, expect } from 'vitest'
import { getWeatherState } from './weather'

describe('getWeatherState', () => {
  it('returns sunny at 80+', () => expect(getWeatherState(80)).toBe('sunny'))
  it('returns sunny at 100', () => expect(getWeatherState(100)).toBe('sunny'))
  it('returns cloudy at 60–79', () => expect(getWeatherState(60)).toBe('cloudy'))
  it('returns overcast at 40–59', () => expect(getWeatherState(40)).toBe('overcast'))
  it('returns rain at 20–39', () => expect(getWeatherState(20)).toBe('rain'))
  it('returns storm at 0–19', () => expect(getWeatherState(0)).toBe('storm'))
  it('returns storm at 19', () => expect(getWeatherState(19)).toBe('storm'))
})
