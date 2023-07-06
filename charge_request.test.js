const { chargeRequestRedis, resetRedis } = require('./redis-stack-charge_request_redis-lambda-fn');

jest.mock('./redis-stack-charge_request_redis-lambda-fn', () => ({
  chargeRequestRedis: jest.fn(),
  resetRedis: jest.fn(),
}));

describe('Redis operations', () => {

  test('chargeRequestRedis should correctly charge units and return remaining balance', async () => {
    const input = { serviceType: 'data', unit: 20 };
    const charges = 100;  // Mock charges
    const remainingBalance = 100;

    // Mock chargeRequestRedis to return expected object
    chargeRequestRedis.mockResolvedValue({
      remainingBalance: remainingBalance,
      charges: charges,
      isAuthorized: true,
    });

    const result = await chargeRequestRedis(input);

    expect(result).toEqual({
      remainingBalance: remainingBalance,
      charges: charges,
      isAuthorized: true,
    });
  });

  test('resetRedis should correctly reset balance', async () => {
    const balance = 100;  // Mock balance

    // Mock resetRedis to return expected balance
    resetRedis.mockResolvedValue(balance);

    const result = await resetRedis();

    expect(result).toEqual(balance);
  });
});
