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

      if (data.fields[data.fields.length - 1]?.name != "_spandays") {
        throw new SplunkVisualizationBase.VisualizationError(
          "Unsupported data format: span length must be at least a day."
        );
      }

      if (data.fields[0].name != "_time") {
        throw new SplunkVisualizationBase.VisualizationError(
          "Unsupported data format: This visualization needs _time as its first field."
        );
      }

      return data;
    },

    // @ts-expect-error
    updateView: function (data, config) {
      if (!data.rows || data.rows.length === 0 || data.rows[0].length === 0) {
        return this;
      }

      let c = this.initChart(this.el);
      let conf = new Config(config, SplunkVisualizationUtils.getCurrentTheme());
      let opt = option(data, conf);
      // let opt = option(data);
      // console.log(opt);
      c.setOption(opt);
      console.log(c.getModel().getComponent("calendar").coordinateSystem.dataToRect("2023-09-01").contentShape);

      // if (data.rows.length >= this.chunk && data.rows.length != 0) {
      //   this.offset += data.rows.length;
      //   this.updateDataParams({ count: this.chunk, offset: this.offset });
      // }
    },

    getInitialDataParams: function () {
      return {
        outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
        count: 1000,
      };
    },

    reflow: function () {
      console.log("dafasdf");
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

interface SearchResult {
  rows: [];
  fields: Field[];
}

interface Params {
  dataIndex: number;
  percent: number;
  value: string;
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

  cellSize(): number[] {
    return [this.radius * 2 + 20, this.radius * 2 + 20];
  }
}

function dimensions(fields: Field[]): string[] {
  return fields.flatMap((x) => {
    let n = x.splitby_value ?? x.name;
    return !n.startsWith("_") ? n : [];
  });
}

function pieSeries(data: SearchResult, dim: string[], conf: Config) {
  return data.rows.flatMap((x, i) => {
    // @ts-expect-error
    const values = x.slice(1, -2);

    return {
      type: "pie",
      id: "pie-" + i,
      center: x[0],
      radius: conf.radius,
      coordinateSystem: "calendar",
      label: {
        formatter: "{c}",
        position: "inside",
        show: false,
      },
      data: dim.map((n, i) => {
        return { name: n, value: values[i] };
      }),
    };
  });
}

function option(data: SearchResult, conf: Config) {
  const dim = dimensions(data.fields);

  return {
    backgroundColor: "transparent",
    legend: { type: "scroll" },
    tooltip: { show: true },
    calendar: {
      top: "middle",
      left: "center",
      orient: "vertical",
      cellSize: conf.cellSize(),
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
      range: ["2023-09"],
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
          offset: conf.cellSize().map((x) => -x / 2 + 10),
        },
        //// @ts-expect-error
        data: data.rows.map((x) => x[0]),
      },
      ...pieSeries(data, dim, conf),
    ],
  };
}

// function dimensions(fields: Field[]): string[] {
//   return fields.flatMap((x) => {
//     return x.splitby_value ?? x.name;
//   });
// }

// function firstNonInternalDimention(dim: string[]): string {
//   return dim.find((x) => !x.startsWith("_")) ?? "-1";
// }

// function series(dim: string[], config: Config) {
//   let ln = lines(config);
//   let ml = {};

//   if (ln.length > 0) {
//     ml = {
//       markLine: {
//         silent: true,
//         symbol: ["none", "none"],
//         lineStyle: { color: "#00000099", opacity: config.markLinesOpacity },
//         data: lines(config),
//       },
//     };
//   }

//   return dim.flatMap((x) => {
//     if (!x.startsWith("_")) {
//       return {
//         type: config.chartType,
//         name: x,
//         showSymbol: false,
//         encode: {
//           x: "_time",
//           y: x,
//         },
//         ...ml,
//       };
//     } else {
//       return [];
//     }
//   });
// }

// function isNotEmpty(c: string): boolean {
//   if (c !== "") {
//     return true;
//   }
//   return false;
// }

// function lineItem(c: string | number) {
//   return { yAxis: c };
// }

// function lines(c: Config) {
//   let data = [];

//   if (c.cr1min !== "") {
//     if (c.cr1min !== 0) {
//       data.push(lineItem(c.cr1min));
//     }
//   } else {
//     return [];
//   }

//   if (c.cr1max !== "") {
//     if (c.cr1max !== 0) {
//       data.push(lineItem(c.cr1max));
//     }
//   } else {
//     return data;
//   }

//   if (c.cr2max !== "") {
//     if (c.cr2max !== 0) {
//       data.push(lineItem(c.cr2max));
//     }
//   } else {
//     return data;
//   }

//   if (c.cr3max !== "") {
//     if (c.cr3max !== 0) {
//       data.push(lineItem(c.cr3max));
//     }
//   } else {
//     return data;
//   }

//   if (c.cr4max !== "") {
//     if (c.cr4max !== 0) {
//       data.push(lineItem(c.cr4max));
//     }
//   } else {
//     return data;
//   }

//   if (c.cr5max !== "") {
//     if (c.cr5max !== "0") {
//       data.push(lineItem(c.cr5max));
//     }
//   }
//   return data;
// }

// function ranges(c: Config) {
//   let pieces = [];

//   if (c.cr1min !== "" && c.cr1max !== "") {
//     pieces.push({
//       gte: c.cr1min,
//       color: c.color1,
//       lt: c.cr1max,
//     });
//   } else {
//     return [];
//   }

//   pieces.push({ gte: c.cr2min, color: c.color2 });
//   if (c.cr2max !== "") {
//     pieces[1].lt = c.cr2max;
//   } else {
//     return pieces;
//   }

//   pieces.push({ gte: c.cr3min, color: c.color3 });
//   if (c.cr3max !== "") {
//     pieces[2].lt = c.cr3max;
//   } else {
//     return pieces;
//   }

//   pieces.push({ gte: c.cr4min, color: c.color4 });
//   if (c.cr4max !== "") {
//     pieces[3].lt = c.cr4max;
//   } else {
//     return pieces;
//   }

//   pieces.push({ gte: c.cr5min, color: c.color5 });
//   if (c.cr5max !== "") {
//     pieces[4].lt = c.cr5max;
//   }
//   return pieces;
// }

// function option(data: SearchResult, config: Config) {
//   let dim = dimensions(data.fields);
//   let p = ranges(config);
//   let vm = {};

//   if (p.length > 0) {
//     vm = {
//       visualMap: {
//         type: "piecewise",
//         top: 50,
//         right: 10,
//         dimension: firstNonInternalDimention(dim),
//         pieces: p,
//         outOfRange: {
//           color: config.outOfRangeColor,
//         },
//       },
//     };
//   }

//   return {
//     backgroundColor: "transparent",
//     legend: { type: "scroll" },
//     tooltip: { show: true, trigger: "axis", axisPointer: { type: "line" } },
//     ...vm,
//     dataset: {
//       source: data.rows,
//       dimensions: dim,
//       sourceHeader: false,
//     },
//     xAxis: {
//       type: "time",
//       maxInterval: 3600 * 1000 * 12,
//     },
//     yAxis: {},
//     series: series(dim, config),
//     toolbox: { feature: { saveAsImage: { backgroundColor: config.background }, dataZoom: {} } },
//   };
// }
