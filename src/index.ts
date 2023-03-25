export interface Env {
  WEBV2RAY: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const ticket = searchParams.get('ticket');

    // 更新 VPN ticket
    if (ticket && token) {
      const updateToken = await env.WEBV2RAY.get('update_token');
      if (token === updateToken) {
        await env.WEBV2RAY.put('vpn_ticket', ticket);
        return new Response(JSON.stringify({ message: 'ok' }), {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
          },
        });
      }
    }

    // 生成节点订阅信息
    if (token) {
      const userToken = await env.WEBV2RAY.get('user_token');
      if (token === userToken) {
        const ticket = await env.WEBV2RAY.get('vpn_ticket');
				const uuid = await env.WEBV2RAY.get('v2ray_uuid');
				const path = await env.WEBV2RAY.get('v2ray_path');
        const res = `
proxies:
	- name: China WebVPN@Lab
		type: vmess
		server: webvpn.shmtu.edu.cn
		port: 443
		uuid: ${uuid}
		alterId: 0
		cipher: auto
		network: ws
		ws-opts:
			path: ${path}
			headers:
				Host: webvpn.shmtu.edu.cn
				Cookie: 'wengine_vpn_ticket=${ticket}; refresh=1;'
		tls: true
		skip-cert-verify: true
		udp: true
`;
        return new Response(res, {
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
          },
        });
      }
    }

    return new Response(JSON.stringify({ message: 'Bad Request' }), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      status: 400,
    });
  },
};
