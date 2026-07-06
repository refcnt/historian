export class Position {
    constructor(public x: number, public y: number) {}

    update(x: number, y: number): void {
        this.x = x
        this.y = y
    }

    distance(other: Position): number {
        const dx = this.x - other.x
        const dy = this.y - other.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    scale(s: number): Position {
        return new Position(this.x * s, this.y * s)
    }

    subtract(other: Position): Position {
        return new Position(this.x - other.x, this.y - other.y)
    }

    subtractWithOffset(dx: number, dy: number): Position {
        return new Position(this.x + dx, this.y + dy)
    }

    direction(other: Position): Position {
        return other.subtract(this).normalize()
    }

    normalize(): Position {
        const len = Math.sqrt(this.x * this.x + this.y * this.y) || 0.01
        return this.scale(1/len)
    }

    pushToDirection(direction: Position, force: number): void {
        this.x += direction.x * force
        this.y += direction.y * force
    }
}

export class Area {
    id: number
    width: number
    height: number
    margin: number = 0
    padding: number = 0
    position: Position
    innerAreas = new Map<number, Area>()

    constructor(width: number, height: number, margin = 0, padding = 0, id = Math.floor(Math.random() * 1000000)) {
        this.id = id
        this.width = width
        this.height = height
        this.margin = margin
        this.padding = padding
        this.position = new Position(this.width / 2, this.height / 2)
    }

    size(): Size {
        return new Size(this.width, this.height)
    }

    sizeWithPadding(): Size {
        return new Size(this.width - this.padding * 2, this.height - this.padding * 2)
    }

    sizeWithMargin(): Size {
        return new Size(this.width + this.margin * 2, this.height + this.margin * 2)
    }

    square(): number {
        return this.width * this.height
    }

    squareWithPadding(): number {
        return (this.width - this.padding * 2) * (this.height - this.padding * 2)
    }

    squareWithMargin(): number {
        return (this.width + this.margin * 2) * (this.height + this.margin * 2)
    }

    widthWithPadding(): number {
        return this.width - this.padding * 2
    }

    widthWithMargin(): number {
        return this.width + this.margin * 2
    }

    heightWithPadding(): number {
        return this.height - this.padding * 2
    }

    heightWithMargin(): number {
        return this.height + this.margin * 2
    }

    createRandomPosition(rng: () => number): Position {
        return new Position(
            this.padding + rng() * (this.width - this.padding),
            this.padding + rng() * (this.height - this.padding),
        )
    }

    boundPosition(pos: Position): void {
        pos.x = Math.max(this.padding, Math.min(this.width - this.padding, pos.x))
        pos.y = Math.max(this.padding, Math.min(this.height - this.padding, pos.y))
    }

    getCenterPosition(): Position {
        return new Position(this.width / 2, this.height / 2)
    }

    setPosition(newPosition: Position): void {
        const offsetX = newPosition.x - this.position.x
        const offsetY = newPosition.y - this.position.y
        for (const area of this.innerAreas.values()) {
            area.setPosition(new Position(area.position.x + offsetX, area.position.y + offsetY))
        }
        this.position = newPosition
    }

    setInnerAreas(areas: Map<number, Area>): void {
        this.innerAreas = areas
    }

    getInnerArea(id: number): Area | undefined {
        return this.innerAreas.get(id)
    }
}

class Row {
    items: Area[] = []
    width: number = 0
    height: number = 0

    constructor(padding: number) {
        this.items = []
        this.width = padding * 2
        this.height = padding * 2
    }

    add(area: Area): void {
        this.items.push(area)
        this.width += area.widthWithMargin()
        this.height = Math.max(this.height, area.heightWithMargin())
    }

    estimateWidth(area: Area): number {
        return this.width + area.widthWithMargin()
    }

    hasItems(): boolean {
        return this.items.length > 0
    }
}

export class AreaBuilder {
    width: number = 0
    height: number = 0
    padding: number = 0
    spaceBetweenAreas: number = 0
    private areas: Area[] = []

    constructor(padding = 0, spaceBetweenAreas = 0) {
        this.spaceBetweenAreas = spaceBetweenAreas
        this.padding = padding
    }

    add(id: number, area: Area): void {
        area.margin = this.spaceBetweenAreas / 2
        this.areas.push(area)
    }

    build(): Area {
        const sorted    = [...this.areas].sort((a, b) => b.height - a.height)

        const n           = sorted.length
        const idealCols   = Math.max(1, Math.ceil(Math.sqrt(n)))
        const maxItemW    = sorted.reduce((mx, a) => Math.max(mx, a.widthWithMargin()), 0)
        const targetWidth = idealCols * maxItemW + 2 * this.padding

        const rows: Row[] = []
        let row = new Row(this.padding)

        for (const area of sorted) {
            if (row.hasItems() && row.estimateWidth(area) > targetWidth) {
                rows.push(row)
                row = new Row(this.padding)
            }
            row.add(area)
        }
        if (row.items.length > 0) rows.push(row)

        this.width  = Math.max(...rows.map(r => r.width), 0)
        this.height = rows.reduce((s, r) => s + r.height + this.padding, this.padding)

        const innerAreas = new Map<number, Area>()
        let y = this.padding
        for (const row of rows) {
            let x = this.padding
            for (const area of row.items) {
                const position = new Position(x + area.margin + area.width / 2, y + area.margin + area.height / 2)
                area.setPosition(position)
                innerAreas.set(area.id, area)
                x += area.widthWithMargin()
            }
            y += row.height + this.padding
        }

        const parentArea = new Area(this.width, this.height)
        parentArea.setInnerAreas(innerAreas)
        return parentArea
    }
}

export class Size {
    constructor(public w: number, public h: number) {}

    radius(): number {
        return Math.max(this.w, this.h) / 2
    }

    scale(s: number): Size {
        return new Size(this.w * s, this.h * s)
    }

    contains(pos: Position, center: Position): boolean {
        return Math.abs(pos.x - center.x) <= this.w / 2
            && Math.abs(pos.y - center.y) <= this.h / 2
    }

    add(other: Size, padding: number): void {
        this.w += other.w + padding
        this.h += other.h + padding
    }
}
