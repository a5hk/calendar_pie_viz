// @ts-expect-error
define(["api/SplunkVisualizationBase", "api/SplunkVisualizationUtils", "echarts"], function (
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

      const c = this.initChart(this.el);
      // const palette = SplunkVisualizationUtils.getColorPalette(
      //   "splunkCategorical",
      //   SplunkVisualizationUtils.getCurrentTheme()
      // );
      // console.log(palette);
      // shuffle(palette);
      const conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      const opt = option(data, conf);
      c.setOption(opt);
    },

    getInitialDataParams: function () {
      return {
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
  firstDay: 0 | 1 | 5 | 6;
  showDates: boolean;
  showMonth: boolean;
  showYear: boolean;
  radius: number;
  #colors = [
    "#2ec7c9",
    "#b6a2de",
    "#5ab1ef",
    "#ffb980",
    "#d87a80",
    "#8d98b3",
    "#e5cf0d",
    "#97b552",
    "#95706d",
    "#dc69aa",
    "#07a2a4",
    "#9a7fd1",
    "#588dd5",
    "#f5994e",
    "#c05050",
    "#59678c",
    "#c9ab00",
    "#7eb00a",
    "#6f5553",
    "#c14089",
  ];

  constructor(c: any, mode: string) {
    this.background = mode === "dark" ? "#333" : "#fff";
    this.foreground = mode === "dark" ? "#fff" : "#333";
    this.showValues =
      c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showValues"] === "true" ? true : false;
    this.showDates =
      c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showDates"] === "false" ? false : true;
    this.showMonth =
      c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showMonth"] === "false" ? false : true;
    this.showYear = c["display.visualizations.custom.calendar_pie_viz.calendar_pie.showYear"] === "true" ? true : false;
    this.firstDay = this.validateDay(c["display.visualizations.custom.calendar_pie_viz.calendar_pie.firstDay"]);
    this.radius = this.validateRadius(c["display.visualizations.custom.calendar_pie_viz.calendar_pie.radius"]);
    this.colors = c;
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
    return d === "" ? 50 : d;
  }

  isColor(hex: string) {
    return /^#[0-9a-f]{6}$/i.test(hex);
  }

  get colors() {
    return this.#colors;
  }

  set colors(c: any) {
    for (let i = 0; i < this.#colors.length; i++) {
      if (this.isColor(c[`display.visualizations.custom.calendar_pie_viz.calendar_pie.color${i + 1}`])) {
        this.#colors[i] = c[`display.visualizations.custom.calendar_pie_viz.calendar_pie.color${i + 1}`];
      }
    }
  }

  get cellSize(): number[] {
    const margin = 20;
    return [this.radius * 2 + margin, this.radius * 2 + margin];
  }
}

// function shuffle(arr: string[]) {
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
// }

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
      tooltip: {
        formatter: "{b}:&nbsp;&nbsp;&nbsp;&nbsp;{c}",
      },
      emphasis: {
        label: {
          show: true,
          formatter: "{d}%",
          fontSize: 14,
          color: conf.foreground,
          backgroundColor: conf.background,
          padding: [3, 6],
        },
      },
      type: "pie",
      center: r._time,
      radius: conf.radius,
      coordinateSystem: "calendar",
      label: {
        formatter: "{d}%",
        position: "inside",
        show: conf.showValues,
      },
      labelLayout: {
        verticalAlign: "middle",
      },
      data: r.data,
    };
  });
}

function option(data: SearchResult, conf: Config) {
  return {
    toolbox: {
      feature: {
        saveAsImage: {
          backgroundColor: conf.background,
          name: "calendar-chart",
        },
      },
    },
    color: conf.colors,
    backgroundColor: "transparent",
    legend: { type: "scroll" },
    tooltip: { show: true },
    calendar: {
      z: 1,
      bottom: 20,
      left: "center",
      orient: "vertical",
      cellSize: conf.cellSize,
      splitLine: {
        lineStyle: {
          color: conf.foreground,
          width: 2,
        },
      },
      itemStyle: {
        color: "transparent",
      },
      yearLabel: {
        show: conf.showYear,
        fontSize: 30,
        margin: 50,
      },
      dayLabel: {
        margin: 20,
        firstDay: conf.firstDay,
        nameMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      monthLabel: {
        fontSize: 16,
        fontWeight: 700,
        show: conf.showMonth,
        margin: 10,
        color: conf.foreground,
      },
      range: [data.results[0]._time, data.results[data.results.length - 1]._time],
    },
    series: [
      {
        type: "scatter",
        coordinateSystem: "calendar",
        symbolSize: 0,
        label: {
          show: conf.showDates,
          formatter: function (params: Params) {
            const date = new Date(params.value);
            return date.getDate();
          },
          fontSize: 14,
          offset: conf.cellSize.map((x) => -x / 2 + 10),
          color: conf.foreground,
        },
        data: data.results.map((x) => x._time),
      },
      ...pieSeries(preProcess(data.results), conf),
    ],
  };
}
