import { useEffect, useMemo, useReducer } from 'react'
import { TOURS } from '../data/tours.js'
import { AppDispatchContext, AppStateContext } from './context.js'

const initialState = {
  isBootstrapped: false,
  isAuthenticated: false,
  user: null,
  tours: TOURS,
  favorites: [],
  filters: {
    search: '',
    maxPrice: 1200,
    difficulty: 'all',
    type: 'all',
    durations: [],
  },
}

function appReducer(state, action) {
  switch (action.type) {
    case 'BOOTSTRAP': {
      return {
        ...state,
        ...action.payload,
        isBootstrapped: true,
      }
    }
    case 'LOGIN': {
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      }
    }
    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      }
    }
    case 'TOGGLE_FAVORITE': {
      const exists = state.favorites.includes(action.payload)
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter((id) => id !== action.payload)
          : [...state.favorites, action.payload],
      }
    }
    case 'UPDATE_FILTERS': {
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      }
    }
    case 'RESET_FILTERS': {
      return {
        ...state,
        filters: initialState.filters,
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const savedAuth = localStorage.getItem('travelweb.auth')
    const savedFavorites = localStorage.getItem('travelweb.favorites')

    let payload = { isAuthenticated: false, user: null, favorites: [] }
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth)
      payload = { ...payload, isAuthenticated: true, user: parsed.user }
    }
    if (savedFavorites) {
      payload.favorites = JSON.parse(savedFavorites)
    }

    dispatch({ type: 'BOOTSTRAP', payload })
  }, [])

  useEffect(() => {
    if (!state.isBootstrapped) return
    if (state.isAuthenticated && state.user) {
      localStorage.setItem('travelweb.auth', JSON.stringify({ user: state.user }))
      return
    }
    localStorage.removeItem('travelweb.auth')
  }, [state.isAuthenticated, state.user, state.isBootstrapped])

  useEffect(() => {
    if (!state.isBootstrapped) return
    localStorage.setItem('travelweb.favorites', JSON.stringify(state.favorites))
  }, [state.favorites, state.isBootstrapped])

  const actions = useMemo(
    () => ({
      login: ({ name, email }) =>
        dispatch({
          type: 'LOGIN',
          payload: {
            user: {
              name,
              email,
              avatar: name.charAt(0).toUpperCase(),
            },
          },
        }),
      logout: () => dispatch({ type: 'LOGOUT' }),
      toggleFavorite: (tourId) => dispatch({ type: 'TOGGLE_FAVORITE', payload: tourId }),
      updateFilters: (payload) => dispatch({ type: 'UPDATE_FILTERS', payload }),
      resetFilters: () => dispatch({ type: 'RESET_FILTERS' }),
    }),
    [],
  )

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={actions}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}
