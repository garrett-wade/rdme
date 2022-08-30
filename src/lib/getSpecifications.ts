import config from 'config';
import { Headers } from 'node-fetch';

import fetch, { cleanHeaders, handleRes } from './fetch';

/**
 * Returns all specification for a given project and version
 *
 * @param {String} key project API key
 * @param {String} selectedVersion project version
 * @returns An array of specification objects
 */
export default async function getSpecification(key: string, selectedVersion: string) {
  function getNumberOfPages() {
    let totalCount = 0;
    return fetch(`${config.get('host')}/api/v1/api-specification?perPage=20&page=1`, {
      method: 'get',
      headers: cleanHeaders(
        key,
        new Headers({
          'x-readme-version': selectedVersion,
          Accept: 'application/json',
        })
      ),
    })
      .then(res => {
        totalCount = Math.ceil(parseInt(res.headers.get('x-total-count'), 10) / 20);
        return handleRes(res);
      })
      .then(res => {
        return { firstPage: res, totalCount };
      });
  }

  const { firstPage, totalCount } = await getNumberOfPages();
  const allSpecifications = firstPage.concat(
    ...(await Promise.all(
      // retrieves all specifications beyond first page
      [...new Array(totalCount + 1).keys()].slice(2).map(async page => {
        return fetch(`${config.get('host')}/api/v1/api-specification?perPage=20&page=${page}`, {
          method: 'get',
          headers: cleanHeaders(
            key,
            new Headers({
              'x-readme-version': selectedVersion,
              Accept: 'application/json',
            })
          ),
        }).then(res => handleRes(res));
      })
    ))
  );

  return allSpecifications;
}
