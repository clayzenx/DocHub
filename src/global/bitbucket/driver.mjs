export default function (config) {
    this.axiosInterceptor = async (params) => {
        if (config.bitbucket_server && ((new URL(params.url)).host === (new URL(config.bitbucket_server)).host)) {
            if (!params.headers) params.headers = {};
            // eslint-disable-next-line no-undef
            params.headers['Authorization'] = `Bearer ${config.personalToken || Vuex?.state?.access_token}`;
            params.headers['X-Atlassian-Token'] = 'no-check';
        }
        return params;
    };

    this.makeFileURI = (projectID, repositoryId, source, branch) => {
        const result_v2 = new URL(
            `/2.0/repositories/${projectID}/${repositoryId}/src/${branch}/`
            + encodeURIComponent(source).split('%2F').join('/')
            , config.bitbucket_server);
        const result_v1 = new URL(
            `rest/api/1.0/projects/${projectID}/repos/${repositoryId}/raw/`
            + encodeURIComponent(source).split('%2F').join('/')
            + `?at=${branch}`
            , config.bitbucket_server);
        const is_bitbacket_v2 = (process.env.VUE_APP_DOCHUB_BITBUCKET_V2 || 'N').toUpperCase() === 'Y';
        return is_bitbacket_v2 ? result_v2 : result_v1;
    };
}