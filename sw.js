/**
 * service worker
 */
let domain = self.location.origin

// 监听install事件
self.addEventListener('install', (event) => {
  // console.log('Service Worker 状态： install');
  event.waitUntil(self.skipWaiting());
});

// 监听activate事件
self.addEventListener('activate', (event) => {
  // console.log('Service Worker 状态： activate');
  // 注意不能忽略这行代码，否则第一次加载会导致fetch事件不触发
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 避免处理非同源请求
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // if (url.pathname.includes('/api/') || url.pathname.includes('.')) {
  //   // 避免处理 api 请求和静态资源请求
  //   return;
  // }

  // // 处理c域名
  // event.respondWith(
  //   (async () => {
  //     try {
  //       const networkResponse = await fetch(event.request);
  //       if (networkResponse.ok) {
  //         return networkResponse;
  //       }
  //       // 如果网络响应不正常，抛出错误进入 catch 块
  //       throw new Error('network error when fetching request');
  //     } catch (err) {
  //       // 记录错误（替换为你自己的错误日志函数）
  //       console.error('请求失败:', err);
  //
  //       if (!navigator.onLine) {
  //         // 离线：返回自定义离线页面
  //         return new Response('<h1>navigator is offLine,Please check the device network</h1>', {
  //           status: 503,
  //           headers: { 'Content-Type': 'text/html' },
  //         });
  //       } else {
  //         // 在线：生成并缓存动态页面
  //         const htmlContent = createDynamicOnlinePage(buildStringMap());
  //         // 异步缓存响应
  //         try {
  //           const cache = await caches.open('online-page');
  //           const cacheRequest = new Request(self.location.origin + '/sw-page.html');
  //           await cache.put(cacheRequest, htmlContent.clone());
  //         } catch (cacheError) {
  //           console.error('缓存失败:', cacheError);
  //         }
  //
  //         // 优先返回新生成的响应，或从缓存中获取
  //         const cacheRequest = new Request(self.location.origin + '/sw-page.html');
  //         const cachedResponse = await caches.match(cacheRequest);
  //         console.log(cachedResponse, 'cachedResponse');
  //         return cachedResponse || htmlContent;
  //       }
  //     }
  //   })(),
  // );
  // console.log('e.request.url', e.request.url)
});

/* ============== */
/* push处理相关部分 */
/* ============== */
// 添加service worker对push的监听
// let action = {}
self.addEventListener('push', function (e) {
  let data = e.data;
  if (e.data) {
    try {
      data = data.json();
    } catch(e) {
      console.log(e)
    }
    // console.log('push的数据为：', data);
    // if (data.data) {
      // actions.push({
      //   action: JSON.stringify({type: 'jump', url: data.data}),
      //   title: 'GO NOW'
      // });
      // action = {type: 'jump', url: data.data}
    // }
    self.registration.showNotification(data.title || '', {
      body: data.body || '',
      url: domain,
      icon: data.icon,
      data: data.data,
      // actions,
      vibrate: [200, 100, 200], // 设备振动200ms，暂停100ms，再振动400ms
    });
  } else {
    // console.log('push没有任何数据');
  }
});
/* ============== */

// sw.js
self.addEventListener('notificationclick', function (e) {
  let action = {type: 'jump', url: e.notification.data}
  // let action = JSON.parse(e.action);
  // console.log(`action tag: ${e.notification.tag}`, `action: ${action}`);

  // switch (action.type) {
  //   case 'jump':
  //     break;
  //   default:
  //     action.type = 'default';
  //     break;
  // }
  e.notification.close();

  e.waitUntil(
    // 获取所有clients
    self.clients.matchAll().then(function (clients) {
      if (!clients || clients.length === 0) {
        // 当不存在client时，打开该网站
        self.clients.openWindow && self.clients.openWindow(domain);
        return;
      }
      // 切换到该站点的tab
      clients[0].focus && clients[0].focus();
      clients.forEach(function (client) {
        // 使用postMessage进行通信
        client.postMessage(action);
      });
    })
  );
});
