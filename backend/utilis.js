import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECERT, (err, user) => {
    if (err) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    req.user = user;
    next();
  });
}

export {
  authenticateToken,
};
