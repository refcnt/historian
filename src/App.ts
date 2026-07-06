import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import type { Node, Connection, Id, ExplorerData, MapRendererProps, SidebarProps } from './common/models'
import { load } from './common/loader/pipeline'
import { pipe, andThen, ok } from './common/result'
import { DEFAULT_DATA } from './common/data_sources'
import { getMap } from './maps/map'
import './App.css'
import { BuildFailed, BuildLoading, Build } from './views'

export default function App() {
  const [data, setData]               = useState<ExplorerData | null>(null)
  const [MapRenderer, setMapRenderer] = useState<ComponentType<MapRendererProps> | null>(null)
  const [Sidebar, setSidebar]         = useState<ComponentType<SidebarProps> | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [focusedNode, setFocusedNode] = useState<Node | null>(null)
  const [selected, setSelected]       = useState<Node | Connection | null>(null)
  const [activeNodeIds, setActiveNodeIds] = useState<Set<Id> | null>(null)
  const [currLevel, setCurrLevel]     = useState(0)
  const [activePathIds, setActivePathIds] = useState<Set<Id>>(() => new Set())

  useEffect(() => {
    const dataPath = new URLSearchParams(window.location.search).get('data') ?? DEFAULT_DATA

    pipe(
      load(dataPath),
      andThen((data: ExplorerData) => {
        const def = getMap(data.mapType)
        return ok({ data, MapRenderer: def.renderer, Sidebar: def.sidebar })
      }),
    ).then(result => {
      if (result.ok) {
        setData(result.value.data)
        setMapRenderer(() => result.value.MapRenderer)
        setSidebar(() => result.value.Sidebar)
      } else {
        setError(result.error)
      }
    })
  }, [])

  const onToggleActive = useCallback((id: Id) => {
    setActiveNodeIds(prev => {
      const next = new Set(prev ?? [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next.size ? next : null
    })
  }, [])

  const onResetActive = useCallback(() => setActiveNodeIds(null), [])

  const onTogglePath = useCallback((id: Id) => {
    setActivePathIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const activePaths = useMemo(
    () => (data ? data.paths.filter(p => activePathIds.has(p.id)) : []),
    [data, activePathIds],
  )

  // The renderer owns the current level; reflect it for the sidebar. The node-tree
  // filter spans levels, so selection is intentionally kept across level changes.
  const onLevelChange = useCallback((level: number) => {
    setCurrLevel(level)
  }, [])

  if (error)                          return BuildFailed(`Failed to load: ${error}`)
  if (!data || !MapRenderer || !Sidebar) return BuildLoading()

  return Build({
    data, MapRenderer, Sidebar,
    focusedNode, selected, activeNodeIds, currLevel, activePathIds, activePaths,
    setFocusedNode, setSelected,
    onToggleActive, onResetActive, onTogglePath, onLevelChange,
  })
}
