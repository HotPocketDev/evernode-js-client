const EvernodeConstants = {
    EVR: 'EVR'
}

const MemoTypes = {
    REDEEM: 'evnRedeem',
    REDEEM_ORIGIN: 'evnRedeemOrigin',
    REDEEM_SUCCESS: 'evnRedeemSuccess',
    REDEEM_ERROR: 'evnRedeemError',
    REDEEM_REF: 'evnRedeemRef',
    HOST_REG: 'evnHostReg',
    HOST_DEREG: 'evnHostDereg',
    REWARD: 'evnReward',
    RECHARGE: 'evnRecharge'
}

const MemoFormats = {
    TEXT: 'text/plain',
    JSON: 'text/json',
    BASE64: 'base64',
    HEX: 'hex'
}

const ErrorCodes = {
    REDEEM_ERR: 'REDEEM_ERR',
}

const ErrorReasons = {
    TRANSACTION_FAILURE: 'TRANSACTION_FAILURE'
}

// Default hook config values.
// If hook's state is empty, values are loaded from here.
const HookStateDefaults = {
    MOMENT_SIZE: 72,
    HOST_REG_FEE: '0.87654321',
    REDEEM_WINDOW: 24,
    MIN_REDEEM: 1,
    HOST_HEARTBEAT_FREQ: 1,
    MOMENT_BASE_IDX: 0,
    REWARD_POOL: '0'
}

// All keys are prefixed with 'EVR' (0x455652)
const HookStateKeys = {
    MOMENT_SIZE: "4556520100000000000000000000000000000000000000000000000000000001",
    HOST_REG_FEE: "4556520100000000000000000000000000000000000000000000000000000003",
    MIN_REDEEM: "4556520100000000000000000000000000000000000000000000000000000004",
    REDEEM_WINDOW: "4556520100000000000000000000000000000000000000000000000000000005",
    HOST_HEARTBEAT_FREQ: "4556520100000000000000000000000000000000000000000000000000000009",
    MOMENT_BASE_IDX: "4556523400000000000000000000000000000000000000000000000000000000",
    REWARD_POOL: "4556523700000000000000000000000000000000000000000000000000000000",

    // Prefixes
    HOST_ADDR: "45565203"
}

const EvernodeEvents = {
    HostRegistered: "HostRegistered",
    HostDeregistered: "HostDeregistered",
    Redeem: "Redeem",
    RedeemSuccess: "RredeemSuccess",
    RedeemError: "RedeemError",
    Reward: "Reward",
    Recharge: "Recharge",
}

module.exports = {
    EvernodeConstants,
    MemoTypes,
    MemoFormats,
    ErrorCodes,
    ErrorReasons,
    HookStateDefaults,
    HookStateKeys,
    EvernodeEvents
}