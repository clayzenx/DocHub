import { KJUR } from "jsrsasign";
import logger from "../utils/logger/index.mjs";

export function getRoles(headers) {
    logger.log(`headers: ${headers}`, 'JWT', 'debug');
    const jwt = headers?.authorization?.slice(7);

    if (!!jwt && typeof jwt === "string" && !jwt.includes('undefined')) {
        try {
            logger.log(`headers.authorization: ${jwt}`, 'JWT', 'debug');
            logger.log(`KJUR.jws.JWS.parse(jwt): ${KJUR.jws.JWS.parse(jwt)}`, 'JWT', 'debug');
            if(KJUR.jws.JWS.verifyJWT(jwt, process.env.VUE_APP_DOCHUB_AUTH_PUBLIC_KEY, {alg: ['RS256']})) {
                return KJUR.jws.JWS.parse(jwt)?.payloadObj?.realm_access?.roles || [];
            } else {
                logger.log(`Verification error: jwt: ${jwt}`, 'JWT', 'warn');
            }
        } catch (e) {
            logger.error(`Error getting user groups! ${e}`, 'JWT', 'error');
            return [];
        }
    }
    return [];
}

export function getUserName(headers) {
    const jwt = headers?.authorization?.slice(7);

    if (!!jwt && typeof jwt === "string" && !jwt.includes('undefined')) {
        try {
            if(KJUR.jws.JWS.verifyJWT(jwt, process.env.VUE_APP_DOCHUB_AUTH_PUBLIC_KEY, {alg: ['RS256']})) {
                return KJUR.jws.JWS.parse(jwt)?.payloadObj.preferred_username || undefined;
            } else {
                logger.log(`Verification error: jwt: ${jwt}`, 'JWT', 'warn');
            }
        } catch (e) {
            logger.error(`Error getting user name! ${e}`, 'JWT', 'error');
            return undefined;
        }
    }
    return undefined;
}

