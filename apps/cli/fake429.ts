import http from "node:http";

let windowStart = Date.now();
let inWindow = 0;
let total = 0;

http
  .createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      total++;
      const now = Date.now();
      if (now - windowStart >= 1000) {
        windowStart = now;
        inWindow = 0;
      }
      inWindow++;

      if (inWindow > 10) {
        console.log(`#${total} -> 429`);
        res.writeHead(429, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            error: { message: "rate limited", type: "rate_limit_error" },
          }),
        );
      } else {
        console.log(`#${total} -> 200`);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "mock",
            object: "chat.completion",
            created: 0,
            model: "mock",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "ok" },
                finish_reason: "stop",
              },
            ],
          }),
        );
      }
    });
  })
  .listen(4010, () => console.log("fake server on 4010, limit 10/sec"));
