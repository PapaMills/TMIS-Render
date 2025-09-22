// backend/utils/ipLookup.js

const axios = require('axios');

const getIPInfo = async (ip) => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      ip: response.data.ip,
      city: response.data.city,
      region: response.data.region,
      country: response.data.country_name,
      org: response.data.org,
    };
  } catch (err) {
    console.error(`IP lookup failed for ${ip}: ${err.message}`);
    return { ip }; // fallback to just IP
  }
};

module.exports = getIPInfo;
