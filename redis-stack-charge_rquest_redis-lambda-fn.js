"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;

const client = redis.createClient({
    host: process.env.ENDPOINT,
    port: parseInt(process.env.PORT || "6379"),
});

client.on("ready", () => {
    console.log('redis client ready');
});

client.on("error", (err) => {
    console.log("Error " + err);
});

exports.chargeRequestRedis = async function (input) {
    let { serviceType, unit } = input;
    
    // Calculate charges based on serviceType and unit here.
    let charges = getCharges(serviceType, unit);

    let remainingBalance = await getBalanceRedis(KEY).catch((err) => {
        console.error('Error fetching balance from Redis:', err);
        // Handle balance fetching error appropriately.
    });

    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }

    remainingBalance = await chargeRedis(KEY, charges).catch((err) => {
        console.error('Error performing charge on Redis:', err);
        // Handle charging error appropriately.
    });

    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

exports.resetRedis = async function () {
    const ret = await resetBalanceRedis(KEY);
    return ret;
};

async function getBalanceRedis(key) {
    try {
        const res = await util.promisify(client.get).bind(client)(key);
        console.log(`Fetched balance from Redis: ${res}`);
        return parseInt(res || "0");
    } catch (err) {
        console.error(`Error fetching balance from Redis: ${err}`);
        throw err;
    }
}

async function chargeRedis(key, charges) {
    return util.promisify(client.decrby).bind(client)(key, charges);
}

async function resetBalanceRedis(key) {
    const res = util.promisify(client.set).bind(client)(key, String(DEFAULT_BALANCE));
    return parseInt(res || "0");
}

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}

function getCharges(serviceType, unit) {
    let costPerUnit;

    switch(serviceType) {
        case 'voice':
            costPerUnit = 10;  // set cost per unit for voice
            break;
        case 'data':
            costPerUnit = 5;  
            break;
        case 'sms':
            costPerUnit = 1;  
            break;
        default:
            costPerUnit = 0;
    }

    return costPerUnit * unit;
}
