/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import $ from 'jquery';
import { stringify } from 'query-string';

interface SendOptions {
  asSystemRequest?: boolean;
}

const esVersion: string[] = [];

export function getVersion() {
  return esVersion;
}

export function getContentType(body: unknown) {
  if (!body) return;
  return 'application/json';
}

export function _getCookie(cname: unknown)
{
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i=0; i<ca.length; i++)
  {
    let c = ca[i].trim();
    if (c.indexOf(name)==0) return c.substring(name.length,c.length);
  }
  return "";
}

export function send(
  method: string,
  path: string,
  data: string | object,
  { asSystemRequest }: SendOptions = {},
  withProductOrigin: boolean = false
) {
  const wrappedDfd = $.Deferred();

  let logicalClusterName = _getCookie('kibanaLogicalCluster');
  let es_url = path;
  if (es_url.startsWith('/')) {
    es_url = es_url.substr(1);
  }
  es_url = '/monitor/' + logicalClusterName + ':' + es_url;
  let uname = _getCookie('monitorUsername');
  let password = _getCookie('monitorPassword');
  if (uname === undefined || password === undefined || uname === '' || password === '') {
    alert("请选择逻辑集群!");
    return;
  }

  const options: JQuery.AjaxSettings = {
    url:
      '../api/console/proxy?' +
      stringify({ es_url, method, ...(withProductOrigin && { withProductOrigin }) }, { sort: false }),
    headers: {
      'kbn-xsrf': 'kibana',
      ...(asSystemRequest && { 'kbn-system-request': 'true' }),
    },
    beforeSend:function(xhr){
      xhr.setRequestHeader('Authorization', "Basic " + btoa(uname + ":" + password));
    },
    data,
    contentType: getContentType(data),
    cache: false,
    crossDomain: true,
    type: 'POST',
    dataType: 'text', // disable automatic guessing
  };

  $.ajax(options).then(
    (responseData, textStatus: string, jqXHR: unknown) => {
      wrappedDfd.resolveWith({}, [responseData, textStatus, jqXHR]);
    },
    ((jqXHR: { status: number; responseText: string }, textStatus: string, errorThrown: Error) => {
      if (jqXHR.status === 0) {
        jqXHR.responseText =
          "\n\nFailed to connect to Console's backend.\nPlease check the Kibana server is up and running";
      }
      wrappedDfd.rejectWith({}, [jqXHR, textStatus, errorThrown]);
    }) as any
  );
  return wrappedDfd;
}

export function constructESUrl(baseUri: string, path: string) {
  baseUri = baseUri.replace(/\/+$/, '');
  path = path.replace(/^\/+/, '');
  return baseUri + '/' + path;
}
