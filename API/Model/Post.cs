using System;

namespace API.Model;

public class Post
{
    public string Title { get; set; }
    public string Content { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
}
