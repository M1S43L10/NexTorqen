import { Database, RefreshCw, Search, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  useVehicleBrands,
  useVehicleModels,
  useVehicleValuations,
  useVehicleVersions,
} from '../../hooks/useArgAutos'
import { searchVehicles } from '../../services/argAutosService'
import './VehicleSelector.css'

const formatMoney = (value, currency) => {
  if (!value) return '-'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const findById = (items, id) => items.find((item) => String(item.id) === String(id))

export function VehicleSelector({ value, onChange }) {
  const [manualMode, setManualMode] = useState(value.source === 'manual')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const brandsState = useVehicleBrands()
  const modelsState = useVehicleModels(value.brand_id_api)
  const versionsState = useVehicleVersions(value.model_id_api)
  const valuationsState = useVehicleValuations(value.version_id_api, value.currency || 'ars')

  const valuations = useMemo(
    () => valuationsState.data?.valuations || [],
    [valuationsState.data?.valuations],
  )
  const availableYears = useMemo(
    () => valuations.map((valuation) => String(valuation.year)),
    [valuations],
  )

  useEffect(() => {
    if (!value.version_id_api || !value.year || !valuations.length) return

    const valuation = valuations.find((item) => String(item.year) === String(value.year))
    if (!valuation || value.estimated_value === valuation.priceNumber) return

    onChange({
      ...value,
      estimated_value: valuation.priceNumber,
      currency: valuationsState.data?.currency || 'ARS',
      source: 'argautos',
    })
  }, [onChange, value, valuations, valuationsState.data?.currency])

  const updateVehicleData = (data) => {
    onChange({
      ...value,
      ...data,
    })
  }

  const handleBrandChange = (brandId) => {
    const brand = findById(brandsState.data, brandId)
    updateVehicleData({
      brand_id_api: brand?.id || '',
      brand_name: brand?.name || '',
      brand: brand?.name || '',
      model_id_api: '',
      model_name: '',
      model: '',
      version_id_api: '',
      version_name: '',
      version: '',
      year: '',
      estimated_value: null,
      source: 'argautos',
    })
  }

  const handleModelChange = (modelId) => {
    const model = findById(modelsState.data, modelId)
    updateVehicleData({
      model_id_api: model?.id || '',
      model_name: model?.name || '',
      model: model?.name || '',
      version_id_api: '',
      version_name: '',
      version: '',
      year: '',
      estimated_value: null,
      source: 'argautos',
    })
  }

  const handleVersionChange = (versionId) => {
    const version = findById(versionsState.data, versionId)
    updateVehicleData({
      version_id_api: version?.id || '',
      version_name: version?.name || '',
      version: version?.name || '',
      year: '',
      estimated_value: null,
      source: 'argautos',
    })
  }

  const handleYearChange = (year) => {
    const valuation = valuations.find((item) => String(item.year) === String(year))
    updateVehicleData({
      year,
      estimated_value: valuation?.priceNumber || null,
      currency: valuationsState.data?.currency || 'ARS',
      source: value.version_id_api ? 'argautos' : value.source,
    })
  }

  const enableManualMode = () => {
    setManualMode(true)
    updateVehicleData({
      source: 'manual',
      brand_id_api: '',
      model_id_api: '',
      version_id_api: '',
      estimated_value: null,
      currency: 'ARS',
    })
  }

  const enableApiMode = () => {
    setManualMode(false)
    updateVehicleData({ source: 'argautos' })
  }

  const hasApiError =
    brandsState.error || modelsState.error || versionsState.error || valuationsState.error

  const handleSearch = async () => {
    setSearchLoading(true)
    setSearchError('')

    try {
      const results = await searchVehicles(searchTerm)
      setSearchResults(results.slice(0, 8))
      if (!results.length) {
        setSearchError('No encontramos resultados para esa busqueda.')
      }
    } catch (error) {
      setSearchError(`${error.message} Podes continuar con carga manual.`)
    } finally {
      setSearchLoading(false)
    }
  }

  const applySearchResult = (result) => {
    updateVehicleData({
      brand_name: result.brand || '',
      brand: result.brand || '',
      model_name: result.model || '',
      model: result.model || '',
      version_id_api: result.version_id || '',
      version_name: result.version || '',
      version: result.version || '',
      year: result.price_year ? String(result.price_year) : '',
      estimated_value: null,
      currency: 'ARS',
      source: 'argautos',
    })
    setManualMode(false)
    setSearchResults([])
    setSearchTerm('')
  }

  return (
    <div className="vehicle-selector">
      <div className="vehicle-selector-header">
        <div>
          <span>Base automotor</span>
          <strong>Arg Autos API</strong>
        </div>
        <div className="vehicle-selector-actions">
          <button className="btn btn-ghost" type="button" onClick={enableManualMode}>
            <Wrench size={17} />
            Carga manual
          </button>
          <button className="btn btn-primary" type="button" onClick={enableApiMode}>
            <Search size={17} />
            Buscar en base automotor
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => {
              brandsState.clearCache()
              brandsState.refresh()
              modelsState.refresh()
              versionsState.refresh()
              valuationsState.refresh()
            }}
            aria-label="Refrescar datos de Arg Autos"
            title="Refrescar datos de Arg Autos"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {hasApiError ? (
        <div className="vehicle-selector-alert">
          {hasApiError} Podes continuar con carga manual.
        </div>
      ) : null}

      {!manualMode && (value.brand_name || value.model_name || value.version_name) ? (
        <div className="selected-vehicle-summary">
          <span>Ficha seleccionada</span>
          <strong>
            {[value.brand_name, value.model_name, value.version_name].filter(Boolean).join(' · ')}
          </strong>
          <small>{value.year ? `Ano ${value.year}` : 'Selecciona un ano para valuacion.'}</small>
        </div>
      ) : null}

      {!manualMode ? (
        <>
          <div className="argautos-search">
            <label className="field">
              <span>Buscar version</span>
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Ej: Hilux SRX 2024, Onix, Amarok"
                value={searchTerm}
              />
            </label>
            <button
              className="btn btn-ghost"
              disabled={searchLoading || searchTerm.trim().length < 2}
              type="button"
              onClick={handleSearch}
            >
              <Search size={17} />
              {searchLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {searchError ? <div className="vehicle-selector-alert">{searchError}</div> : null}

          {searchResults.length ? (
            <div className="argautos-results">
              {searchResults.map((result) => (
                <button
                  key={`${result.version_id}-${result.price_year}`}
                  type="button"
                  onClick={() => applySearchResult(result)}
                >
                  <strong>{`${result.brand} ${result.model}`}</strong>
                  <span>{result.version}</span>
                  <small>{`Ano ${result.price_year || '-'}`}</small>
                </button>
              ))}
            </div>
          ) : null}

          <div className="vehicle-selector-grid">
            <label className="field">
              <span>Marca</span>
              <select
                disabled={brandsState.loading}
                onChange={(event) => handleBrandChange(event.target.value)}
                value={value.brand_id_api || ''}
              >
                <option value="">{brandsState.loading ? 'Cargando marcas...' : 'Seleccionar marca'}</option>
                {brandsState.data.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Modelo</span>
              <select
                disabled={!value.brand_id_api || modelsState.loading}
                onChange={(event) => handleModelChange(event.target.value)}
                value={value.model_id_api || ''}
              >
                <option value="">
                  {modelsState.loading ? 'Cargando modelos...' : 'Seleccionar modelo'}
                </option>
                {modelsState.data.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Version</span>
              <select
                disabled={!value.model_id_api || versionsState.loading}
                onChange={(event) => handleVersionChange(event.target.value)}
                value={value.version_id_api || ''}
              >
                <option value="">
                  {versionsState.loading ? 'Cargando versiones...' : 'Seleccionar version'}
                </option>
                {versionsState.data.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Ano</span>
              <select
                disabled={!value.version_id_api || valuationsState.loading}
                onChange={(event) => handleYearChange(event.target.value)}
                value={value.year || ''}
              >
                <option value="">
                  {valuationsState.loading ? 'Cargando valuaciones...' : 'Seleccionar ano'}
                </option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      ) : (
        <div className="vehicle-selector-grid">
          <label className="field">
            <span>Marca manual</span>
            <input
              onChange={(event) =>
                updateVehicleData({
                  brand_name: event.target.value,
                  brand: event.target.value,
                  source: 'manual',
                })
              }
              required
              value={value.brand_name || value.brand || ''}
            />
          </label>
          <label className="field">
            <span>Modelo manual</span>
            <input
              onChange={(event) =>
                updateVehicleData({
                  model_name: event.target.value,
                  model: event.target.value,
                  source: 'manual',
                })
              }
              required
              value={value.model_name || value.model || ''}
            />
          </label>
          <label className="field">
            <span>Version manual</span>
            <input
              onChange={(event) =>
                updateVehicleData({
                  version_name: event.target.value,
                  version: event.target.value,
                  source: 'manual',
                })
              }
              value={value.version_name || value.version || ''}
            />
          </label>
          <label className="field">
            <span>Ano</span>
            <input
              inputMode="numeric"
              onChange={(event) =>
                updateVehicleData({
                  year: event.target.value,
                  source: 'manual',
                })
              }
              value={value.year || ''}
            />
          </label>
        </div>
      )}

      <div className="valuation-panel">
        <Database size={18} />
        <div>
          <span>Valuacion estimada</span>
          <strong>{formatMoney(value.estimated_value, value.currency || 'ARS')}</strong>
          <small>
            {value.source === 'argautos'
              ? 'Dato informativo obtenido desde Arg Autos.'
              : 'Carga manual sin valuacion automatica.'}
          </small>
        </div>
      </div>
    </div>
  )
}
