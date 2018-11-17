import Cache from '../core/Cache';

const DEFAULT_RENEW_HANDICAP_MS = 60 * 1000; // 1 minute

export interface AuthOptions {
    refreshHandicapMs?: number;
}

export interface AuthOptionsConstructor extends AuthOptions {
    cache: Cache;
    cacheId: string;
}

export default class Auth {
    private _cache: Cache;

    private readonly _cacheId: string;

    private readonly _refreshHandicapMs: number;

    constructor({cache, cacheId, refreshHandicapMs = DEFAULT_RENEW_HANDICAP_MS}: AuthOptionsConstructor) {
        this._cache = cache;
        this._cacheId = cacheId;
        this._refreshHandicapMs = refreshHandicapMs;
    }

    async data(): Promise<AuthData> {
        return (
            (await this._cache.getItem(this._cacheId)) || {
                token_type: '',
                access_token: '',
                expire_time: 0,
                expires_in: '',
                refresh_token: '',
                refresh_token_expires_in: '',
                refresh_token_expire_time: 0,
                scope: ''
            }
        );
    }

    async setData(newData: AuthData = {}) {
        const data = await this.data();

        await this._cache.setItem(this._cacheId, {
            ...data,
            ...newData,
            expire_time: Date.now() + parseInt(newData.expires_in, 10) * 1000,
            refresh_token_expire_time: Date.now() + parseInt(newData.refresh_token_expires_in, 10) * 1000
        });
    }

    /**
     * Check if there is a valid (not expired) access token
     */
    async accessTokenValid() {
        const authData = await this.data();
        return authData.expire_time - this._refreshHandicapMs > Date.now();
    }

    /**
     * Check if there is a valid (not expired) access token
     */
    async refreshTokenValid() {
        return (await this.data()).refresh_token_expire_time > Date.now();
    }

    async cancelAccessToken() {
        return this.setData({
            access_token: '',
            expires_in: '-1'
        });
    }
}

export interface AuthData {
    token_type?: string;
    access_token?: string;
    expires_in?: string;
    expire_time?: number;
    refresh_token?: string;
    refresh_token_expires_in?: string;
    refresh_token_expire_time?: number;
    scope?: string;
}
