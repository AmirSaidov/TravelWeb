import { createContext, useContext } from 'react'

export const AppStateContext = createContext(null)
export const AppDispatchContext = createContext(null)

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}

export function useAppActions() {
  const context = useContext(AppDispatchContext)
  if (!context) {
    throw new Error('useAppActions must be used within AppProvider')
  }
  return context
}
