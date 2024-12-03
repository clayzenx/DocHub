export function checkRepositoryAPI(req, res, next) {
  const [protocol] = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST.split(':');

  const isBitbucketApiV2 = process.env.VUE_APP_DOCHUB_BITBUCKET_V2
    ? process.env.VUE_APP_DOCHUB_BITBUCKET_V2.toLowerCase() === 'y'
    : false;

  if (protocol === 'bitbucket' && isBitbucketApiV2) {
    next();
  } else {
    return res
      .status(404)
      .json({ message: 'Данное API поддерживает Bitbucket Cloud API v2.0' });
  }
}
