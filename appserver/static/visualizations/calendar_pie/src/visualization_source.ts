// @ts-expect-error
define([
  "api/SplunkVisualizationBase",
  "api/SplunkVisualizationUtils",
  "echarts",
  // "echarts/theme/vintage",
], function (
  // @ts-expect-error
  SplunkVisualizationBase,
  // @ts-expect-error
  SplunkVisualizationUtils,
  // @ts-expect-error
  echarts
) {
  return SplunkVisualizationBase.extend({
    initialize: function () {
      this.chunk = 1000;
      this.offset = 0;
      SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
      this.el.classList.add("vizviz-calendar-container");
    },

    // @ts-expect-error
    formatData: function (data) {
      if (data.fields.length == 0) {
        return data;
      }

      // @ts-expect-error
      if (!data.fields.some((x) => x.name === "_time")) {
        throw new SplunkVisualizationBase.VisualizationError(
          "Unsupported data format: This visualization needs _time field."
        );
      }

      return data;
    },

    // @ts-expect-error
    updateView: function (data, config) {
      if (!data.results || data.results.length === 0) {
        return this;
      }

      let c = this.initChart(this.el);
      let conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      let opt = option(data, conf);
      c.setOption(opt);
    },

    getInitialDataParams: function () {
      return {
        // outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        outputMode: SplunkVisualizationBase.RAW_OUTPUT_MODE,
        count: 1000,
      };
    },

    reflow: function () {
      echarts.getInstanceByDom(this.el)?.resize();
    },

    initChart: function (e: HTMLElement) {
      if (SplunkVisualizationUtils.getCurrentTheme() == "dark") {
        return echarts.init(e, "dark");
      }
      return echarts.init(e);
    },
  });
});

// TypeScript from here

interface Field {
  name: string;
  splitby_value?: string;
}

interface Result {
  [key: string]: string;
}

interface SearchResult {
  fields: Field[];
  results: Result[];
}

interface Params {
  dataIndex: number;
  percent: number;
  value: string;
}

interface PieRecord {
  name: string;
  value: string;
}

interface PieData {
  _time: string;
  data: PieRecord[];
}

class Config {
  background: string;
  foreground: string;
  showValues: boolean;
  showDates: boolean;
  firstDay: 0 | 1 | 5 | 6;
  radius: number;

  constructor(c: any, mode: string) {
    this.background = mode === "dark" ? "#101317" : "#fff";
    this.foreground = mode === "dark" ? "#eaeaea" : "#333";
    this.showValues =
      c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showValues"] === "true" ? true : false;
    this.showDates =
      c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showDates"] === "true" ? true : false;
    this.firstDay = this.validateDay(c["display.visualizations.custom.calendar_pie_viz.calendar_pie.firstDay"]);
    this.radius = this.validateRadius(c["display.visualizations.custom.calendar_pie_viz.calendar_pie.radius"]);
  }

  sanitizeItem(s: string): number | "" {
    return !Number.isNaN(parseInt(s)) ? parseInt(s) : "";
  }

  validateDay(day: string): 0 | 1 | 5 | 6 {
    const d = this.sanitizeItem(day);
    if (d === 0 || d === 1 || d === 5 || d === 6) {
      return d;
    } else {
      return 1;
    }
  }

  validateRadius(rad: string): number {
    const d = this.sanitizeItem(rad);
    return d === "" ? 30 : d;
  }

  get cellSize(): number[] {
    return [this.radius * 2 + 20, this.radius * 2 + 20];
  }
}

function preProcess(data: Result[]): PieData[] {
  const res: PieData[] = [];

  data.map((row) => {
    const rec: PieRecord[] = [];

    for (const k in row) {
      if (!k.startsWith("_")) {
        rec.push({ name: k, value: row[k] });
      }
    }
    res.push({ _time: row["_time"], data: rec });
  });

  return res;
}

function pieSeries(data: PieData[], conf: Config) {
  return data.map((r) => {
    return {
      type: "pie",
      center: r._time,
      radius: conf.radius,
      coordinateSystem: "calendar",
      label: {
        formatter: "{c}",
        position: "inside",
        show: false,
      },
      data: r.data,
    };
  });
}

function option(data: SearchResult, conf: Config) {
  return {
    backgroundColor: "transparent",
    legend: { type: "scroll" },
    tooltip: { show: true },
    calendar: {
      top: "middle",
      left: "center",
      orient: "vertical",
      cellSize: conf.cellSize,
      yearLabel: {
        show: false,
        fontSize: 30,
      },
      dayLabel: {
        margin: 20,
        firstDay: conf.firstDay,
        nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      monthLabel: {
        show: false,
      },
      range: [data.results[0]._time, data.results[data.results.length - 1]._time],
    },
    series: [
      {
        type: "scatter",
        coordinateSystem: "calendar",
        symbolSize: 0,
        label: {
          show: true,
          formatter: function (params: Params) {
            const date = new Date(params.value);
            return date.getDate();
          },
          fontSize: 14,
          offset: conf.cellSize.map((x) => -x / 2 + 10),
        },
        data: data.results.map((x) => x._time),
      },
      ...pieSeries(preProcess(data.results), conf),
    ],
  };
}
