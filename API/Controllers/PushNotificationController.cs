using System.Text.Json.Serialization;
using API.Model;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace API
{
    [Route("api/[controller]")]
    [ApiController]
    public class PushNotificationController : ControllerBase
    {
        private static readonly List<PushSubscription> Subscriptions = new List<PushSubscription>(); // Simulação em memória (pode ser substituído por uma base de dados)
        private static readonly List<Post> Posts = new List<Post>(); // Simulação em memória (pode ser substituído por uma base de dados)
        private readonly PushServiceClient _pushClient;
        private const string PublicKey = "BBi45lQ8J24_-0Ja6uaRuvC5DD2_DxqjoWVh_1UxFeO34BBw3fneevukBjPo53CTM17zctIdq2G78_c_KVA6ntI";
        private const string PrivateKey = "L7L3xnGSn3PLaUb5ujLxFXTU9nziplLlhBtQUxH2jqY";
        private const string Subject = "mailto:eryx.guimaraes@gmail.com";

        public PushNotificationController()
        {
            _pushClient = new PushServiceClient
            {
                DefaultAuthentication = new VapidAuthentication(PublicKey, PrivateKey)
                {
                    Subject = Subject
                }
            };
        }

        // Registrar a Subscrição
        [HttpPost("subscribe")]
        public IActionResult Subscribe([FromBody] PushSubscription subscription)
        {
            // Verifica se a subscrição já existe
            if (!Subscriptions.Any(s => s.Endpoint == subscription.Endpoint))
            {
                Subscriptions.Add(subscription);
                return Ok(new { message = "Subscrição registrada com sucesso." });
            }

            return Conflict(new { message = "Subscrição já existente." });
        }

        // Listar Subscrições
        [HttpGet("subscriptions")]
        public IActionResult GetSubscriptions()
        {
            return Ok(Subscriptions);
        }

        // Excluir Subscrição
        [HttpDelete("unsubscribe")]
        public IActionResult Unsubscribe([FromBody] PushSubscription subscription)
        {
            var sub = Subscriptions.FirstOrDefault(s => s.Endpoint == subscription.Endpoint);
            if (sub != null)
            {
                Subscriptions.Remove(sub);
                return Ok(new { message = "Subscrição removida com sucesso." });
            }

            return NotFound(new { message = "Subscrição não encontrada." });
        }

        // Enviar Notificação para todas as subscrições
        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] Post post)
        {
            try
            {
                await SendPushNotificationAsync(post);
                return Ok(new { message = "Notificação enviada com sucesso!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Falha ao enviar notificação: {ex.Message}" });
            }
        }

        private async Task SendPushNotificationAsync(Post post)
        {
            // Serializa o objeto Post em formato JSON
            var postJson = JsonContent.Create(post);

            var pushMessage = new PushMessage(postJson); // Mensagem a ser enviada

            foreach (var subscription in Subscriptions)
            {
                try
                {
                    await _pushClient.RequestPushMessageDeliveryAsync(subscription, pushMessage);
                }
                catch (Exception ex)
                {
                    // Opcional: Log ou tratamento adicional de falha para notificações individuais
                    Console.WriteLine($"Falha ao enviar notificação para {subscription.Endpoint}: {ex.Message}");
                }
            }
        }

        // Listar conteudos
        [HttpGet("posts")]
        public IActionResult GetPosts()
        {
            return Ok(Posts);
        }

        [HttpPost("storePostData")]
        public async Task<IActionResult> AddPost([FromBody] Post post)
        {
            Posts.Add(post);

            await SendPushNotificationAsync(post);

            return Ok(new { message = "Post adicionado com sucesso." });
        }
    }
}
