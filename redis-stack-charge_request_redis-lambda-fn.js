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
    try {
        let { serviceType, unit } = input;
        
        // Calculate charges based on serviceType and unit here.
        let charges = getCharges(serviceType, unit);

        let remainingBalance = await getBalanceRedis(KEY);

        const isAuthorized = authorizeRequest(remainingBalance, charges);
        if (!isAuthorized) {
            return {
                remainingBalance,
                isAuthorized,
                charges: 0,
            };
        }

        remainingBalance = await chargeRedis(KEY, charges);

        return {
            remainingBalance,
            charges,
            isAuthorized,
        };
    } catch (err) {
        console.error('An error occurred:', err);
    }
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
    try {
        return await util.promisify(client.decrby).bind(client)(key, charges);
    } catch (err) {
        console.error(`Error charging Redis: ${err}`);
        throw err;
    }
}

async function resetBalanceRedis(key) {
    try {
        const res = await util.promisify(client.set).bind(client)(key, String(DEFAULT_BALANCE));
        return parseInt(res || "0");
    } catch (err) {
        console.error(`Error resetting balance in Redis: ${err}`);
        throw err;
    }
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
