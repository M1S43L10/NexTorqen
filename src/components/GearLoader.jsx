import loaderGear from '../assets/nextorqen-loader-tuerca.svg'

export function GearLoader({ label = 'Cargando...', size = 'default', tone = 'inline' }) {
  return (
    <div className={`gear-loader gear-loader-${size} gear-loader-${tone}`} role="status">
      <img src={loaderGear} alt="" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
