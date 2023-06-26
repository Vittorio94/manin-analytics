const state = {
  daysToLoad: 7,
};

async function getData() {
  const res = await fetch(
    "https://analytics-durable-object-prod.vittorio-dev.workers.dev/get"
  );

  const analytics = await res.json();
  state.analytics = analytics;
  console.log(analytics);
  parseData();
  createCharts();
  updateTopReferrers();
}

function parseData() {
  const pathNameTotals = {};
  const countryTotals = {};
  const referrerTotals = {};
  const uniquePathNameTotals = {};
  const uniqueCountryTotals = {};
  const uniqueReferrerTotals = {};
  const labels = [];
  for (let i = state.daysToLoad - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    let dateStr =
      d.getFullYear() +
      "-" +
      addLeadingZero(d.getMonth() + 1) +
      "-" +
      addLeadingZero(d.getDate());
    labels.push(dateStr);

    if (state.analytics[dateStr]) {
      const pathNames = Object.keys(state.analytics[dateStr].pathNames);
      for (const pathName of pathNames) {
        if (!pathNameTotals[pathName]) {
          pathNameTotals[pathName] = 0;
        }
        if (!uniquePathNameTotals[pathName]) {
          uniquePathNameTotals[pathName] = 0;
        }
        const uniqueVisits = Object.keys(
          state.analytics[dateStr].pathNames[pathName]
        ).length;
        uniquePathNameTotals[pathName] += uniqueVisits;
        const ips = Object.keys(state.analytics[dateStr].pathNames[pathName]);
        for (const ip of ips) {
          pathNameTotals[pathName] +=
            state.analytics[dateStr].pathNames[pathName][ip];
        }
      }

      const countries = Object.keys(state.analytics[dateStr].countries);
      for (const country of countries) {
        if (!uniqueCountryTotals[country]) {
          uniqueCountryTotals[country] = 0;
        }
        if (!countryTotals[country]) {
          countryTotals[country] = 0;
        }
        const uniqueVisits = Object.keys(
          state.analytics[dateStr].countries[country]
        ).length;
        uniqueCountryTotals[country] += uniqueVisits;
        const ips = Object.keys(state.analytics[dateStr].countries[country]);
        for (const ip of ips) {
          countryTotals[country] +=
            state.analytics[dateStr].countries[country][ip];
        }
      }

      const referrers = Object.keys(state.analytics[dateStr].referrers);
      for (const referrer of referrers) {
        if (!uniqueReferrerTotals[referrer]) {
          uniqueReferrerTotals[referrer] = 0;
        }
        if (!referrerTotals[referrer]) {
          referrerTotals[referrer] = 0;
        }
        const uniqueVisits = Object.keys(
          state.analytics[dateStr].referrers[referrer]
        ).length;
        uniqueReferrerTotals[referrer] += uniqueVisits;
        const ips = Object.keys(state.analytics[dateStr].referrers[referrer]);
        for (const ip of ips) {
          referrerTotals[referrer] +=
            state.analytics[dateStr].referrers[referrer][ip];
        }
      }
    }
  }

  const pathNames = Object.keys(pathNameTotals);
  const countries = Object.keys(countryTotals);
  const referrers = Object.keys(referrerTotals);
  const pathNameValues = pathNames.reduce((obj, key) => {
    obj[key] = [];
    return obj;
  }, {});
  const countryValues = countries.reduce((obj, key) => {
    obj[key] = [];
    return obj;
  }, {});
  const uniquePathNameValues = pathNames.reduce((obj, key) => {
    obj[key] = [];
    return obj;
  }, {});
  const uniqueCountryValues = countries.reduce((obj, key) => {
    obj[key] = [];
    return obj;
  }, {});
  for (const dateStr of labels) {
    if (state.analytics[dateStr]) {
      for (const pathName of pathNames) {
        if (state.analytics[dateStr].pathNames[pathName]) {
          const uniqueVisits = Object.keys(
            state.analytics[dateStr].pathNames[pathName]
          ).length;
          uniquePathNameValues[pathName].push(uniqueVisits);
          const ips = Object.keys(state.analytics[dateStr].pathNames[pathName]);
          let dayTotal = 0;
          for (const ip of ips) {
            dayTotal += state.analytics[dateStr].pathNames[pathName][ip];
          }
          pathNameValues[pathName].push(dayTotal);
        } else {
          uniquePathNameValues[pathName].push(0);
          pathNameValues[pathName].push(0);
        }
      }

      for (const country of countries) {
        if (state.analytics[dateStr].countries[country]) {
          const uniqueVisits = Object.keys(
            state.analytics[dateStr].countries[country]
          ).length;
          uniqueCountryValues[country].push(uniqueVisits);
          const ips = Object.keys(state.analytics[dateStr].countries[country]);
          let dayTotal = 0;
          for (const ip of ips) {
            dayTotal += state.analytics[dateStr].countries[country][ip];
          }
          countryValues[country].push(dayTotal);
        } else {
          countryValues[country].push(0);
          uniqueCountryValues[country].push(0);
        }
      }
    } else {
      for (const pathName of pathNames) {
        pathNameValues[pathName].push(0);
        uniquePathNameValues[pathName].push(0);
      }
      for (const country of countries) {
        countryValues[country].push(0);
        uniqueCountryValues[country].push(0);
      }
    }
  }

  console.log("pathNameTotals: ", pathNameTotals);
  console.log("countryTotals: ", countryTotals);
  console.log("referrerTotals: ", referrerTotals);
  console.log("pathNameValues: ", pathNameValues);
  console.log("countryValues: ", countryValues);

  state.labels = labels;
  state.pathNames = pathNames;
  state.countries = countries;
  state.referrers = countries;
  state.pathNameTotals = pathNameTotals;
  state.countryTotals = countryTotals;
  state.referrerTotals = referrerTotals;
  state.uniquePathNameTotals = uniquePathNameTotals;
  state.uniqueCountryTotals = uniqueCountryTotals;
  state.uniqueReferrerTotals = uniqueReferrerTotals;
  state.pathNameValues = pathNameValues;
  state.countryValues = countryValues;
  state.uniquePathNameValues = uniquePathNameValues;
  state.uniqueCountryValues = uniqueCountryValues;
}

function populatePagesSelect(pages) {}

function createCharts() {
  // COUNTRIES CHART
  const countryCanvas = document.getElementById("country-chart");
  const countryChart = new ApexCharts(countryCanvas, {
    chart: {
      animations: {
        enabled: false,
      },
      type: "line",
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "By country",
    },
    theme: {
      palette: "palette7",
    },
    stroke: {
      //curve: "smooth",
      width: 2,
    },
    xaxis: {
      categories: state.labels,
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
    series: state.countries.map((country) => {
      return {
        name: country,
        data: state.uniqueCountryValues[country],
      };
    }),
  });

  const pathCanvas = document.getElementById("path-chart");
  const pathChart = new ApexCharts(pathCanvas, {
    chart: {
      animations: {
        enabled: false,
      },
      type: "line",
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "By page",
    },
    theme: {
      palette: "palette7",
    },
    stroke: {
      //curve: "smooth",
      width: 2,
    },
    xaxis: {
      categories: state.labels,
    },
    yaxis: {
      min: 0,
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 300,
          },
        },
      },
    ],
    series: state.pathNames.map((pathName) => {
      return {
        name: pathName,
        data: state.uniquePathNameValues[pathName],
      };
    }),
  });

  state.countryChart = countryChart;
  state.pathChart = pathChart;

  countryChart.render();
  pathChart.render();
}

function updateCharts() {
  const checkbox = document.getElementById("unique-checkbox");
  if (checkbox.checked) {
    state.countryChart.updateOptions({
      xaxis: {
        categories: state.labels,
      },
      series: state.countries.map((country) => {
        return {
          name: country,
          data: state.uniqueCountryValues[country],
        };
      }),
    });
    state.pathChart.updateOptions({
      xaxis: {
        categories: state.labels,
      },
      series: state.pathNames.map((pathName) => {
        return {
          name: pathName,
          data: state.uniquePathNameValues[pathName],
        };
      }),
    });
  } else {
    state.countryChart.updateSeries(
      state.countries.map((country) => {
        return {
          name: country,
          data: state.countryValues[country],
        };
      })
    );
    state.pathChart.updateSeries(
      state.pathNames.map((pathName) => {
        return {
          name: pathName,
          data: state.pathNameValues[pathName],
        };
      })
    );
  }
}

function updateTopReferrers() {
  const checkbox = document.getElementById("unique-checkbox");
  let referrerTotals;
  if (checkbox.checked) {
    referrerTotals = state.uniqueReferrerTotals;
    // use unique values
  } else {
    // use non-unique values
    referrerTotals = state.referrerTotals;
  }

  // order referrer keys
  const orderedKeys = Object.keys(referrerTotals).sort(
    (a, b) => referrerTotals[b] - referrerTotals[a]
  );

  // create html elements
  const newGrid = document.createElement("div");
  newGrid.classList.add("referrers-grid");
  newGrid.id = "referrers-grid";
  for (const key of orderedKeys) {
    const label = document.createElement("div");
    label.classList.add("referrer-label");
    label.textContent = `${key}:`;

    const value = document.createElement("div");
    value.classList.add("referrer-value");
    value.textContent = referrerTotals[key];

    newGrid.append(label, value);
  }

  document.getElementById("referrers-grid").replaceWith(newGrid);
}

// adds a 0 to number below 9
function addLeadingZero(n) {
  if (n > 9) {
    return `${n}`;
  } else {
    return `0${n}`;
  }
}

getData();

// EVENT LISTENERS
document.getElementById("unique-checkbox").addEventListener("input", (e) => {
  updateCharts();
  updateTopReferrers();
});

document
  .getElementById("days-to-load-select")
  .addEventListener("change", (e) => {
    state.daysToLoad = parseInt(e.target.value);
    parseData();
    updateCharts();
    updateTopReferrers();
    console.log(state);
  });
