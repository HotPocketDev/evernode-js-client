const { Buffer } = require('buffer');
const { XflHelpers } = require('./xfl-helpers');
const { EvernodeConstants, ErrorReasons } = require('./evernode-common');

// Utility helper functions.
class UtilHelpers {

    static getStateData(states, key) {
        const state = states.find(s => key === s.key);
        if (!state)
            throw { code: ErrorReasons.NO_STATE_KEY, error: `State key '${key}' not found.` };

        return state.data;
    }

    static readUInt(buf, base = 32, isBE = true) {
        buf = Buffer.from(buf);
        switch (base) {
            case (8):
                return buf.readUInt8();
            case (16):
                return isBE ? buf.readUInt16BE() : buf.readUInt16LE();
            case (32):
                return isBE ? buf.readUInt32BE() : buf.readUInt32LE();
            case (64):
                return isBE ? Number(buf.readBigUInt64BE()) : Number(buf.readBigUInt64LE());
            default:
                throw 'Invalid base value';
        }
    }

    static decodeLeaseNftUri(hexUri) {
        // Get the lease index from the nft URI.
        // <prefix><lease index (uint16)><half of tos hash (16 bytes)><lease amount (uint32)>
        const prefixLen = EvernodeConstants.LEASE_NFT_PREFIX_HEX.length / 2;
        const halfToSLen = 16;
        const uriBuf = Buffer.from(hexUri, 'hex');
        return {
            leaseIndex: uriBuf.readUint16BE(prefixLen),
            halfTos: uriBuf.slice(prefixLen + 2, halfToSLen),
            leaseAmount: parseFloat(XflHelpers.toString(uriBuf.readBigInt64BE(prefixLen + 2 + halfToSLen)))
        }
    }
}

module.exports = {
    UtilHelpers
}