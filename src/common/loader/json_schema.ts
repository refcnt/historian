export interface JsonNode {
  id:       string
  name:     string
  type?:    string
  color?:   string
  weight?:  number
  fromTs?:  number
  toTs?:    number
  children?: JsonNode[]
}

export interface JsonConnection {
  id:       string
  name:     string
  from:     string
  to:       string
  color?:   string
  weight?:  number
  fromTs?:  number
  toTs?:    number
  children?: JsonConnection[]
}

export interface JsonData {
  type?:       string
  name?:       string
  info:        Record<string, unknown>
  nodes:       JsonNode[]
  connections: JsonConnection[]
}
