# Glossary

Vocabulary for `@proton/charts`, the package that owns chart.js, its registration and theme colour resolution. Paths are relative to `packages/charts/src`.

Only chart terms are added here, to create a coherent domain language.

## Trend chart

- **Trend chart**: a single line read for its shape over time, optionally ruled at a threshold and filled beneath. One series, never several. _Avoid_: line chart, sparkline, time series. "Line chart" is the chart.js primitive the trend chart is built on, not the thing itself.
- **Series**: the whole run of readings a chart draws, in order. _Avoid_: dataset, which is chart.js's word for its own wrapper around the same values.
- **Reading**: one measurement in a series, and the unit a caller thinks in. `DataPoint` is its type: a **label** and a **value**. _Avoid_: point, sample, bucket, datum. "Point" is reserved for the drawn mark (see **latest point**), so a reading is not a point unless it is marked.
- **Missed reading**: a reading that was never taken, carried as a `null` value. The line is drawn across it rather than broken or dropped to zero — a gap in the telemetry is not a measurement of nothing. _Avoid_: gap, hole, null point, zero.

### Axes

- **Value axis**: the axis the readings are measured against (chart.js's `y`). _Avoid_: y axis, vertical axis.
- **Label axis**: the axis the readings are named along (chart.js's `x`). It carries labels, not values: the trend chart never treats it as a scale of time. _Avoid_: x axis, time axis, category axis.
- **Value tick**: one mark written on the value axis. A caller may name them itself, in place of the ones chart.js would choose, so a plot read for its shape carries a handful of marks rather than a full ruler. _Avoid_: gridline, which is the rule across the plot rather than the mark at its edge, and "label", which belongs to the other axis.
- **Value range**: the two readings the floor and ceiling of the plot stand for, pinned by the caller so two charts can be compared. Unpinned, each chart fits its own series and two very different series draw the same picture. _Avoid_: scale, bounds, domain, min/max.
- **Whole values**: the property of a series that counts things, and therefore has no fractions in it. It is a claim about the readings, not about how they are formatted; the axis is held to whole steps because of it. _Avoid_: integer axis, rounding, precision.

### The threshold

- **Threshold**: the one reading a trend chart is judged against — a capacity limit, a target. The line changes colour where it crosses, and the plot is ruled at it. _Avoid_: limit, target, baseline, cutoff.
- **Rule**: a dashed horizontal line drawn across the plot at one reading. The threshold has one; so does each guide. _Avoid_: line (that is the series), gridline, marker.
- **Guide**: a fainter rule at a value tick, so a height can be measured rather than judged against a number at the edge of the plot. Drawn behind the line and its fill, so it reads as backdrop rather than as something laid over the series; the threshold's rule is drawn over both. _Avoid_: gridline. chart.js's grid is a different thing and cannot be dashed.
- **Above / below**: which side of the threshold a stretch of line falls, and the two colours the line and its fill are painted in. With no threshold, the whole line is **below**. _Avoid_: over/under, good/bad, ok/warning. The colours carry no judgement of their own; the caller decides which side is the bad one.

### Waiting and arriving

- **Mode**: whether a chart is waiting for its series (`load`) or drawing it (`view`). _Avoid_: state, loading flag.
- **Skeleton**: the line drawn in place of a series that has not arrived. It is a stand-in, not data: it is never read, hovered or marked. _Avoid_: placeholder (reserved for the blocks, below), dummy data, mock, loading state.
- **Placeholder block**: one of the small rounded blocks drawn where a tick's label will go while the chart waits. They stand for labels, not for readings. _Avoid_: shimmer, bone, skeleton tick.
- **Arrival**: the animation a series is drawn in with when it replaces a skeleton. Suppressed while loading and for a reader who has asked for reduced motion. _Avoid_: transition, entrance.

### Marks and shape

- **Latest point**: a dot on the last reading a series actually has — not the last position in it, which a missed reading may leave empty. It answers "where are we now", so a chart read only for its shape does not carry one. _Avoid_: last point, current value, end marker, endpoint.
- **Fill**: the translucent area painted between the line and the floor of the plot, in the line's own colour on each side of the threshold. _Avoid_: area, shading, background.
- **Tension**: how much the line is smoothed between readings. A reading is a bend in the line, not a mark of its own. _Avoid_: curve, smoothing, interpolation.
- **Overhang**: the room kept outside the plot so an edge label can sit centred on its tick rather than being clipped — above the plot for the topmost value, right of it for the last label. _Avoid_: padding, margin, inset.
