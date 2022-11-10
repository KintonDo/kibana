/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import $ from 'jquery';
import { stringify } from 'query-string';

const esVersion: string[] = [];

export function getVersion() {
  return esVersion;
}

export function getContentType(body: any) {
  if (!body) return;
  return 'application/json';
}

//获取请求参数
export function _getRequestParam(key: string)
{
  let url = location.search;
  let theRequest = new Object();
  if (url.indexOf("?") != -1)
  {
    let str = url.substr(1);
    let strs = str.split("&");
    for (let i = 0; i < strs.length; i++)
    {
      theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
    }
  }
  return theRequest[key];
}

//获取Cookie参数
function _getCookie(cname: any)
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

export function send(method: string, path: string, data: any) {
  const wrappedDfd = $.Deferred();

  let logicalClusterName = _getCookie('kibanaLogicalCluster');

  if (logicalClusterName === undefined || logicalClusterName === '') {
    alert('请选择逻辑集群');
    return;
  }
  let es_url = path;
  if (path.startsWith('/')) {
    path = path.substr(1);
  }
  // es_url = '/monitor/' + logicalClusterName + ':' + es_url;
  path = '/' + logicalClusterName + '-' + path;

  const options: JQuery.AjaxSettings = {
    url: '../api/console/proxy?' + stringify({ path, method }, { sort: false }),
    headers: {
      'kbn-xsrf': 'kibana',
    },
    data,
    contentType: getContentType(data),
    cache: false,
    crossDomain: true,
    type: 'POST',
    dataType: 'text', // disable automatic guessing
    // beforeSend:function(xhr){
    //   xhr.setRequestHeader('Authorization', "Basic " + btoa(uname + ":" + password));
    // },
  };

  $.ajax(options).then(
    (responseData: any, textStatus: string, jqXHR: any) => {
      wrappedDfd.resolveWith({}, [responseData, textStatus, jqXHR]);
    },
    ((jqXHR: any, textStatus: string, errorThrown: Error) => {
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
