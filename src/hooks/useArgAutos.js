import { useCallback, useEffect, useState } from 'react'
import {
  clearArgAutosCache,
  getBrands,
  getModelsByBrand,
  getValuationsByVersion,
  getVersionsByModel,
} from '../services/argAutosService'

const initialState = {
  data: [],
  error: '',
  loading: false,
}

const useArgAutosResource = (loader, deps, enabled = true) => {
  const [state, setState] = useState(initialState)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let active = true

    if (!enabled) {
      Promise.resolve().then(() => {
        if (active) setState(initialState)
      })
      return () => {
        active = false
      }
    }

    Promise.resolve().then(() => {
      if (active) setState((current) => ({ ...current, error: '', loading: true }))
    })

    loader({ refresh: refreshIndex > 0 })
      .then((data) => {
        if (!active) return
        setState({ data, error: '', loading: false })
      })
      .catch((error) => {
        if (!active) return
        setState({ data: [], error: error.message, loading: false })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshIndex, enabled])

  return {
    ...state,
    refresh: useCallback(() => setRefreshIndex((value) => value + 1), []),
  }
}

export function useVehicleBrands() {
  return {
    ...useArgAutosResource((options) => getBrands(options), []),
    clearCache: clearArgAutosCache,
  }
}

export function useVehicleModels(brandId) {
  return useArgAutosResource(
    (options) => getModelsByBrand(brandId, options),
    [brandId],
    Boolean(brandId),
  )
}

export function useVehicleVersions(modelId) {
  return useArgAutosResource(
    (options) => getVersionsByModel(modelId, options),
    [modelId],
    Boolean(modelId),
  )
}

export function useVehicleValuations(versionId, currency = 'ars') {
  const [state, setState] = useState({
    data: { currency: currency.toUpperCase(), valuations: [] },
    error: '',
    loading: false,
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let active = true

    if (!versionId) {
      Promise.resolve().then(() => {
        if (!active) return
        setState({
          data: { currency: currency.toUpperCase(), valuations: [] },
          error: '',
          loading: false,
        })
      })
      return () => {
        active = false
      }
    }

    Promise.resolve().then(() => {
      if (active) setState((current) => ({ ...current, error: '', loading: true }))
    })

    getValuationsByVersion(versionId, currency, { refresh: refreshIndex > 0 })
      .then((data) => {
        if (!active) return
        setState({ data, error: '', loading: false })
      })
      .catch((error) => {
        if (!active) return
        setState({
          data: { currency: currency.toUpperCase(), valuations: [] },
          error: error.message,
          loading: false,
        })
      })

    return () => {
      active = false
    }
  }, [currency, refreshIndex, versionId])

  return {
    ...state,
    refresh: useCallback(() => setRefreshIndex((value) => value + 1), []),
  }
}
