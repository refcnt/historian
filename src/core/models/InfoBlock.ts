export type TabContent =
  | { type: 'text';  text: string }
  | { type: 'list';  items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'image'; url: string; alt?: string }

export interface Tab {
  title: string
  content: TabContent
}

export interface InfoBlock {
  tabs: Tab[]
}
