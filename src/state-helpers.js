const codec = require('ripple-address-codec');
const { Buffer } = require('buffer');
const { HookStateKeys, EvernodeConstants } = require('./evernode-common');
const { XflHelpers } = require('./xfl-helpers');
const crypto = require("crypto");

const NFTOKEN_PREFIX = '00000000';

const HOST_TOKEN_ID_OFFSET = 0;
const HOST_COUNTRY_CODE_OFFSET = 32;
const HOST_RESERVED_OFFSET = 34;
const HOST_DESCRIPTION_OFFSET = 42;
const HOST_REG_LEDGER_OFFSET = 68;
const HOST_REG_FEE_OFFSET = 76;
const HOST_TOT_INS_COUNT_OFFSET = 84;
const HOST_ACT_INS_COUNT_OFFSET = 88;
const HOST_HEARTBEAT_LEDGER_IDX_OFFSET = 92;
const HOST_VERSION_OFFSET = 100;

const HOST_ADDRESS_OFFSET = 0;
const HOST_CPU_MODEL_NAME_OFFSET = 20;
const HOST_CPU_COUNT_OFFSET = 60;
const HOST_CPU_SPEED_OFFSET = 62;
const HOST_CPU_MICROSEC_OFFSET = 64;
const HOST_RAM_MB_OFFSET = 68;
const HOST_DISK_MB_OFFSET = 72;

const STATE_KEY_TYPES = {
    TOKEN_ID: 2,
    HOST_ADDR: 3
}

const EVERNODE_PREFIX = 'EVR';
const HOST_ADDR_KEY_ZERO_COUNT = 8;
const HOOK_STATE_LEDGER_TYPE_PREFIX = 118; // Decimal value of ASCII 'v'

class StateHelpers {
    static StateTypes = {
        TOKEN_ID: 'tokenId',
        HOST_ADDR: 'hostAddr',
        SIGLETON: 'singleton',
        CONFIGURATION: 'configuration'
    }

    static decodeHostAddressState(stateKeyBuf, stateDataBuf) {
        return {
            address: codec.encodeAccountID(stateKeyBuf.slice(12)),
            nfTokenId: stateDataBuf.slice(HOST_TOKEN_ID_OFFSET, HOST_COUNTRY_CODE_OFFSET).toString('hex').toUpperCase(),
            countryCode: stateDataBuf.slice(HOST_COUNTRY_CODE_OFFSET, HOST_RESERVED_OFFSET).toString(),
            description: stateDataBuf.slice(HOST_DESCRIPTION_OFFSET, HOST_REG_LEDGER_OFFSET).toString().replace(/\0/g, ''),
            registrationLedger: Number(stateDataBuf.readBigUInt64BE(HOST_REG_LEDGER_OFFSET)),
            registrationFee: Number(stateDataBuf.readBigUInt64BE(HOST_REG_FEE_OFFSET)),
            maxInstances: stateDataBuf.readUInt32BE(HOST_TOT_INS_COUNT_OFFSET),
            activeInstances: stateDataBuf.readUInt32BE(HOST_ACT_INS_COUNT_OFFSET),
            lastHeartbeatLedger: Number(stateDataBuf.readBigUInt64BE(HOST_HEARTBEAT_LEDGER_IDX_OFFSET)),
            version: `${stateDataBuf.readUInt8(HOST_VERSION_OFFSET)}.${stateDataBuf.readUInt8(HOST_VERSION_OFFSET + 1)}.${stateDataBuf.readUInt8(HOST_VERSION_OFFSET + 2)}`
        }
    }

    static decodeTokenIdState(stateDataBuf) {
        return {
            address: codec.encodeAccountID(stateDataBuf.slice(HOST_ADDRESS_OFFSET, HOST_CPU_MODEL_NAME_OFFSET)),
            cpuModelName: stateDataBuf.slice(HOST_CPU_MODEL_NAME_OFFSET, HOST_CPU_COUNT_OFFSET).toString().replace(/\x00+$/, ''), // Remove trailing \x00 characters.
            cpuCount: stateDataBuf.readUInt16BE(HOST_CPU_COUNT_OFFSET),
            cpuMHz: stateDataBuf.readUInt16BE(HOST_CPU_SPEED_OFFSET),
            cpuMicrosec: stateDataBuf.readUInt32BE(HOST_CPU_MICROSEC_OFFSET),
            ramMb: stateDataBuf.readUInt32BE(HOST_RAM_MB_OFFSET),
            diskMb: stateDataBuf.readUInt32BE(HOST_DISK_MB_OFFSET)
        }
    }

    static decodeStateData(stateKey, stateData) {
        const hexKey = stateKey.toString('hex').toUpperCase();
        if (Buffer.from(HookStateKeys.PREFIX_HOST_ADDR, 'hex').compare(stateKey, 0, 4) === 0) {
            return {
                type: this.StateTypes.HOST_ADDR,
                key: hexKey,
                ...this.decodeHostAddressState(stateKey, stateData)
            }
        }
        else if (Buffer.from(HookStateKeys.PREFIX_HOST_TOKENID, 'hex').compare(stateKey, 0, 4) === 0) {
            // Generate the address state key.
            const addressKeyBuf = Buffer.alloc(32, 0);
            Buffer.from(HookStateKeys.PREFIX_HOST_ADDR, 'hex').copy(addressKeyBuf);
            stateData.copy(addressKeyBuf, 12, HOST_ADDRESS_OFFSET, HOST_CPU_MODEL_NAME_OFFSET)
            return {
                type: this.StateTypes.TOKEN_ID,
                key: hexKey,
                addressKey: addressKeyBuf.toString('hex').toUpperCase(),
                ...this.decodeTokenIdState(stateData)
            }
        }
        else if (Buffer.from(HookStateKeys.HOST_COUNT, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.SIGLETON,
                key: hexKey,
                value: stateData.readUInt32BE()
            }
        }
        else if (Buffer.from(HookStateKeys.MOMENT_BASE_IDX, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.SIGLETON,
                key: hexKey,
                value: Number(stateData.readBigInt64BE())
            }
        }
        else if (Buffer.from(HookStateKeys.HOST_REG_FEE, 'hex').compare(stateKey) === 0 || Buffer.from(HookStateKeys.MAX_REG, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.SIGLETON,
                key: hexKey,
                value: Number(stateData.readBigUInt64BE())
            }
        }
        else if (Buffer.from(HookStateKeys.EVR_ISSUER_ADDR, 'hex').compare(stateKey) === 0 || Buffer.from(HookStateKeys.FOUNDATION_ADDR, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.CONFIGURATION,
                key: hexKey,
                value: codec.encodeAccountID(stateData)
            }
        }
        else if (Buffer.from(HookStateKeys.MOMENT_SIZE, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.HOST_HEARTBEAT_FREQ, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.LEASE_ACQUIRE_WINDOW, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.CONFIGURATION,
                key: hexKey,
                value: stateData.readUInt16BE()
            }
        }
        else if (Buffer.from(HookStateKeys.MINT_LIMIT, 'hex').compare(stateKey) === 0 || Buffer.from(HookStateKeys.FIXED_REG_FEE, 'hex').compare(stateKey) === 0) {
            return {
                type: this.StateTypes.CONFIGURATION,
                key: hexKey,
                value: Number(stateData.readBigUInt64BE())
            }
        }
        else if (Buffer.from(HookStateKeys.PURCHASER_TARGET_PRICE, 'hex').compare(stateKey) === 0) {
            const xfl = stateData.readBigInt64BE(0);
            const val = XflHelpers.toString(xfl);
            return {
                type: this.StateTypes.CONFIGURATION,
                key: hexKey,
                value: val
            }
        }
        else
            throw { type: 'Validation Error', message: 'Invalid state key.' };
    }

    static decodeStateKey(stateKey) {
        const hexKey = stateKey.toString('hex').toUpperCase();
        if (Buffer.from(HookStateKeys.PREFIX_HOST_ADDR, 'hex').compare(stateKey, 0, 4) === 0) {
            return {
                key: hexKey,
                type: this.StateTypes.HOST_ADDR
            };
        }
        else if (Buffer.from(HookStateKeys.PREFIX_HOST_TOKENID, 'hex').compare(stateKey, 0, 4) === 0) {
            return {
                key: hexKey,
                type: this.StateTypes.TOKEN_ID
            };
        }
        else if (Buffer.from(HookStateKeys.HOST_COUNT, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.MOMENT_BASE_IDX, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.HOST_REG_FEE, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.MAX_REG, 'hex').compare(stateKey) === 0) {
            return {
                key: hexKey,
                type: this.STATE_TYPES.SIGLETON
            };
        }
        else if (Buffer.from(HookStateKeys.EVR_ISSUER_ADDR, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.FOUNDATION_ADDR, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.MOMENT_SIZE, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.PURCHASER_TARGET_PRICE, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.HOST_HEARTBEAT_FREQ, 'hex').compare(stateKey) ||
            Buffer.from(HookStateKeys.MINT_LIMIT, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.FIXED_REG_FEE, 'hex').compare(stateKey) === 0 ||
            Buffer.from(HookStateKeys.LEASE_ACQUIRE_WINDOW, 'hex').compare(stateKey) === 0) {
            return {
                key: hexKey,
                type: this.STATE_TYPES.CONFIGURATION
            };
        }
        else
            throw { type: 'Validation Error', message: 'Invalid state key.' };
    }

    static generateTokenIdStateKey(nfTokenId) {
        // 1 byte - Key Type.
        let buf = Buffer.allocUnsafe(1);
        buf.writeUInt8(STATE_KEY_TYPES.TOKEN_ID);

        const nfTokenIdBuf = Buffer.from(nfTokenId, "hex");
        const stateKeyBuf = (Buffer.concat([Buffer.from(EVERNODE_PREFIX, "utf-8"), buf, nfTokenIdBuf.slice(4, 32)]));
        return stateKeyBuf.toString('hex').toUpperCase();
    }

    static generateHostAddrStateKey(address) {
        // 1 byte - Key Type.
        // 8 bytes - Zeros.
        let buf = Buffer.allocUnsafe(9);
        buf.writeUInt8(STATE_KEY_TYPES.HOST_ADDR);
        for (let i = 0; i < HOST_ADDR_KEY_ZERO_COUNT; i++) {
            buf.writeUInt8(0, i+1);
        }

        const addrBuf = Buffer.from(codec.decodeAccountID(address), "hex");
        const stateKeyBuf = Buffer.concat([Buffer.from(EVERNODE_PREFIX, "utf-8"), buf, addrBuf]);
        return stateKeyBuf.toString('hex').toUpperCase();
    }

    static  getHookStateIndex(hookAccount, stateKey, hookNamespace = EvernodeConstants.HOOK_NAMESPACE) {
        const typeBuf = Buffer.allocUnsafe(2);
        typeBuf.writeInt16BE(HOOK_STATE_LEDGER_TYPE_PREFIX);

        const accIdBuf = codec.decodeAccountID(hookAccount);
        const stateKeyBuf = Buffer.from(stateKey, 'hex');
        const namespaceBuf = Buffer.from(hookNamespace, 'hex');

        let hash = crypto.createHash('sha512');

        let data = hash.update(typeBuf);
        data = hash.update(accIdBuf);
        data = hash.update(stateKeyBuf);
        data = hash.update(namespaceBuf);

        const digest = data.digest('hex');
        // Get the first 32 bytes of hash.
        return digest.substring(0, 64).toUpperCase();
    }
}

module.exports = {
    StateHelpers
}