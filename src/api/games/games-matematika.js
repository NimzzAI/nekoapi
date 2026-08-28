const modes = {
  noob: [-3, 3, -3, 3, "+-", 15000, 10],
  easy: [-10, 10, -10, 10, "*/+-", 20000, 40],
  medium: [-40, 40, -20, 20, "*/+-", 40000, 150],
  hard: [-100, 100, -70, 70, "*/+-", 60000, 350],
  extreme: [-999999, 999999, -999999, 999999, "*/", 99999, 9999],
  impossible: [
    -99999999999,
    99999999999,
    -99999999999,
    999999999999,
    "*/",
    30000,
    35000,
  ],
  impossible2: [
    -999999999999999,
    999999999999999,
    -999,
    999,
    "/",
    30000,
    50000,
  ],
  impossible3: [
    -999999999999999999,
    999999999999999999,
    -999999999999999999,
    999999999999999999,
    "*/",
    100000,
    100000,
  ],
  impossible4: [
    -999999999999999999999,
    999999999999999999999,
    -999999999999999999999,
    999999999999999999999,
    "*/",
    500000,
    500000,
  ],
  impossible5: [
    -999999999999999999999999,
    999999999999999999999999,
    -999999999999999999999999,
    999999999999999999999999,
    "*/",
    1000000,
    1000000,
  ],
};

const operators = {
  "+": "+",
  "-": "-",
  "*": "×",
  "/": "÷",
};

function randomInt(from, to) {
  if (from > to) [from, to] = [to, from];
  from = Math.floor(from);
  to = Math.floor(to);
  return Math.floor((to - from) * Math.random() + from);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function scrape(level) {
  const [a1, a2, b1, b2, ops, time, bonus] = modes[level];
  let a = randomInt(a1, a2);
  let b = randomInt(b1, b2);
  const op = pickRandom([...ops]);
  let result;

  if (op === "/") {
    while (b === 0) {
      b = randomInt(b1, b2);
    }
    result = a;
    a = result * b;
  } else {
    result = new Function(`return ${a} ${op.replace("/", "*")} ${b < 0 ? `(${b})` : b}`)();
  }

  return {
    str: `${a} ${operators[op]} ${b}`,
    mode: level,
    time: time,
    bonus: bonus,
    result: result,
  };
}

module.exports = function (app) {
  app.get("/games/matematika", async (req, res) => {
    const { level } = req.query || {};

    if (level && typeof level !== "string") {
      return res.status(400).json({
        status: false,
        creator: "Nimzz",
        message: "Parameter level harus berupa string",
        error: "Invalid parameter type"
      });
    }

    const validLevels = Object.keys(modes);
    const randomLevel = level && validLevels.includes(level) ? level : pickRandom(validLevels);

    try {
      const mathProblem = await scrape(randomLevel);

      if (!mathProblem) {
        return res.status(500).json({
          status: false,
          creator: "Nimzz",
          message: "Gagal menghasilkan soal matematika",
          error: "No result returned"
        });
      }

      res.json({
        status: true,
        creator: "Nimzz",
        result: {
          data: mathProblem,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error("Error matematika:", error.message);
      
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          status: false,
          creator: "Nimzz",
          message: "Request timeout - Terlalu lama memproses.",
          error: "Timeout"
        });
      }
      
      res.status(500).json({
        status: false,
        creator: "Nimzz",
        message: "Terjadi kesalahan internal.",
        error: error.message
      });
    }
  });
};