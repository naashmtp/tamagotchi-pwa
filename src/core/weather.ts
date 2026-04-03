export type WeatherState = 'sunny' | 'cloudy' | 'overcast' | 'rain' | 'storm'

export function getWeatherState(happiness: number): WeatherState {
  if (happiness >= 80) return 'sunny'
  if (happiness >= 60) return 'cloudy'
  if (happiness >= 40) return 'overcast'
  if (happiness >= 20) return 'rain'
  return 'storm'
}
