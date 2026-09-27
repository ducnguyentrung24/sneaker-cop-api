const jwt = require("jsonwebtoken");

const {
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN,
} = process.env;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET || !ACCESS_TOKEN_EXPIRES_IN || !REFRESH_TOKEN_EXPIRES_IN) {
    throw new Error("Missing JWT configuration. Set ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN, and REFRESH_TOKEN_EXPIRES_IN in .env.");
}

const generateAccessToken = (payload) => jwt.sign(
    { ...payload, tokenType: "access" },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
);

const generateRefreshToken = (payload) => jwt.sign(
    { ...payload, tokenType: "refresh" },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
);

const verifyAccessToken = (token) => {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (decoded.tokenType !== "access") throw new Error("Invalid access token");
    return decoded;
};

const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (decoded.tokenType !== "refresh") throw new Error("Invalid refresh token");
    return decoded;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
