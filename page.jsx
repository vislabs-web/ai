"use client";
import React from "react";

import { useHandleStreamResponse } from "../utilities/runtime-helpers";

function MainComponent() {
  const [messages, setMessages] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState("");
  const [isGeneratingImage, setIsGeneratingImage] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleFinish = React.useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: message,
        type: "text",
        timestamp: new Date(),
      },
    ]);
    setStreamingMessage("");
    setIsTyping(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: (chunk) => {
      setStreamingMessage(chunk);
      setIsTyping(true);
    },
    onFinish: handleFinish,
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      type: "text",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");

    // Check if user is asking for image generation
    const imageKeywords = [
      "generate image",
      "create image",
      "draw",
      "make image",
      "text to image",
      "image of",
      "picture of",
    ];
    const isImageRequest = imageKeywords.some((keyword) =>
      currentInput.toLowerCase().includes(keyword)
    );

    if (isImageRequest) {
      setIsGeneratingImage(true);
      try {
        let imagePrompt = currentInput;
        imageKeywords.forEach((keyword) => {
          imagePrompt = imagePrompt.toLowerCase().replace(keyword, "").trim();
        });

        const response = await fetch(
          `/integrations/dall-e-3/?prompt=${encodeURIComponent(imagePrompt)}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate image");
        }

        const result = await response.json();
        const imageUrl = result.data[0];

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: imageUrl,
            type: "image",
            prompt: imagePrompt,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Image generation error:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't generate the image. Please try again.",
            type: "text",
            timestamp: new Date(),
          },
        ]);
      }
      setIsGeneratingImage(false);
      return;
    }

    // Regular ChatGPT conversation
    setIsLoading(true);
    setIsTyping(true);

    const systemMessage = {
      role: "system",
      content: `You are an AI assistant created by Vishwakarma Vaibhav. When someone asks about Vaibhav or who created you, respond with: "I am the unique creation of Vishwakarma Vaibhav. He is my master as well as teacher. If you want to know about him or want to see his other projects, then visit this https://www.instagram.com/bros.projects/". You can also generate images when users ask for "generate image", "create image", "draw", "make image", or similar requests.`,
    };

    const conversationMessages = [
      systemMessage,
      ...messages.filter((msg) => msg.type === "text"),
      userMessage,
    ];

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      handleStreamResponse(response);
    } catch (error) {
      console.error("ChatGPT error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          type: "text",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const quickPrompts = [
    { icon: "🤖", text: "Who is Vaibhav?", prompt: "Who is Vaibhav?" },
    {
      icon: "🎨",
      text: "Generate sunset image",
      prompt: "Generate image of a beautiful sunset over mountains",
    },
    {
      icon: "💡",
      text: "Tell me a joke",
      prompt: "Tell me a funny programming joke",
    },
    {
      icon: "🌟",
      text: "Creative writing",
      prompt: "Write a short creative story about AI",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Enhanced Header */}
      <header
        style={{
          padding: "25px 20px",
          textAlign: "center",
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                background: "linear-gradient(45deg, #fff, #e0e7ff)",
                borderRadius: "50%",
                padding: "10px",
                boxShadow: "0 8px 32px rgba(255,255,255,0.2)",
              }}
            >
              🤖
            </div>
            <div>
              <h1
                style={{
                  fontSize: "2.2rem",
                  margin: "0",
                  fontWeight: "800",
                  background: "linear-gradient(45deg, #fff, #e0e7ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.5px",
                }}
              >
                Vaibhav's AI Assistant
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "5px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#4ade80",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
                <span
                  style={{
                    fontSize: "0.9rem",
                    opacity: "0.9",
                    fontWeight: "500",
                  }}
                >
                  Online • Powered by ChatGPT & DALL-E 3
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
              fontSize: "0.85rem",
              opacity: "0.9",
            }}
          >
            <span>💬 Smart Conversations</span>
            <span>🎨 Image Generation</span>
            <span>⚡ Real-time Responses</span>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <div
        style={{
          flex: "1",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Chat Messages Area */}
        <div
          style={{
            flex: "1",
            backgroundColor: "rgba(255,255,255,0.98)",
            borderRadius: "24px",
            padding: "0",
            marginBottom: "20px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: "1",
              overflowY: "auto",
              padding: "30px",
              scrollBehavior: "smooth",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "4rem",
                    marginBottom: "25px",
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ✨
                </div>
                <h2
                  style={{
                    color: "#1f2937",
                    fontSize: "1.8rem",
                    marginBottom: "15px",
                    fontWeight: "700",
                  }}
                >
                  Welcome to the Future of AI
                </h2>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#6b7280",
                    marginBottom: "40px",
                    lineHeight: "1.6",
                  }}
                >
                  I'm your intelligent assistant, ready to chat, create images,
                  and help with anything you need!
                </p>

                {/* Quick Action Buttons */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "15px",
                    maxWidth: "600px",
                    margin: "0 auto",
                  }}
                >
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(prompt.prompt)}
                      style={{
                        padding: "15px 20px",
                        backgroundColor: "#f8fafc",
                        border: "2px solid #e2e8f0",
                        borderRadius: "16px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textAlign: "left",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#667eea";
                        e.target.style.borderColor = "#667eea";
                        e.target.style.color = "white";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 8px 25px rgba(102, 126, 234, 0.3)";
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = "#f8fafc";
                        e.target.style.borderColor = "#e2e8f0";
                        e.target.style.color = "#374151";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ fontSize: "1.2rem", marginBottom: "5px" }}>
                        {prompt.icon}
                      </div>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent:
                        message.role === "user" ? "flex-end" : "flex-start",
                      marginBottom: "25px",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >
                    {message.role === "assistant" && (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(45deg, #667eea, #764ba2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          flexShrink: 0,
                        }}
                      >
                        🤖
                      </div>
                    )}

                    <div
                      style={{
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                          message.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          padding:
                            message.type === "image" ? "12px" : "16px 20px",
                          borderRadius:
                            message.role === "user"
                              ? "20px 20px 6px 20px"
                              : "20px 20px 20px 6px",
                          backgroundColor:
                            message.role === "user"
                              ? "linear-gradient(45deg, #667eea, #764ba2)"
                              : "#f8fafc",
                          color: message.role === "user" ? "white" : "#1f2937",
                          boxShadow:
                            message.role === "user"
                              ? "0 8px 25px rgba(102, 126, 234, 0.3)"
                              : "0 4px 15px rgba(0,0,0,0.08)",
                          border:
                            message.role === "assistant"
                              ? "1px solid #e5e7eb"
                              : "none",
                          background:
                            message.role === "user"
                              ? "linear-gradient(45deg, #667eea, #764ba2)"
                              : "#f8fafc",
                        }}
                      >
                        {message.type === "image" ? (
                          <div>
                            <img
                              src={message.content}
                              alt={`Generated: ${message.prompt}`}
                              style={{
                                width: "100%",
                                maxWidth: "400px",
                                borderRadius: "12px",
                                display: "block",
                              }}
                            />
                            <p
                              style={{
                                margin: "12px 0 0 0",
                                fontSize: "0.85rem",
                                color: "#6b7280",
                                fontStyle: "italic",
                              }}
                            >
                              🎨 Generated: {message.prompt}
                            </p>
                          </div>
                        ) : (
                          <div
                            style={{
                              whiteSpace: "pre-wrap",
                              lineHeight: "1.5",
                              fontSize: "0.95rem",
                            }}
                          >
                            {message.content}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {message.role === "user" ? "👤 You" : "🤖 AI"} •{" "}
                        {formatTime(message.timestamp)}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(45deg, #10b981, #059669)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.2rem",
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Message */}
                {streamingMessage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginBottom: "25px",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>

                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "16px 20px",
                        borderRadius: "20px 20px 20px 6px",
                        backgroundColor: "#f8fafc",
                        color: "#1f2937",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                        border: "1px solid #e5e7eb",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.5",
                          fontSize: "0.95rem",
                        }}
                      >
                        {streamingMessage}
                      </div>
                      {isTyping && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "12px",
                            fontSize: "0.7rem",
                            color: "#667eea",
                            fontWeight: "500",
                          }}
                        >
                          typing...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Loading States */}
                {(isLoading || isGeneratingImage) && !streamingMessage && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      marginBottom: "25px",
                      alignItems: "flex-end",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                        flexShrink: 0,
                        animation: "pulse 2s infinite",
                      }}
                    >
                      🤖
                    </div>

                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: "20px 20px 20px 6px",
                        backgroundColor: "#f8fafc",
                        color: "#1f2937",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                        border: "1px solid #e5e7eb",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#667eea",
                            animation: "bounce 1.4s infinite ease-in-out",
                          }}
                        ></div>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#667eea",
                            animation: "bounce 1.4s infinite ease-in-out 0.16s",
                          }}
                        ></div>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#667eea",
                            animation: "bounce 1.4s infinite ease-in-out 0.32s",
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                        {isGeneratingImage
                          ? "🎨 Creating your image..."
                          : "💭 Thinking..."}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.98)",
            borderRadius: "24px",
            padding: "20px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: "1", position: "relative" }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here... Try asking about Vaibhav or request an image!"
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: "18px",
                  border: "2px solid #e5e7eb",
                  fontSize: "16px",
                  outline: "none",
                  resize: "none",
                  minHeight: "56px",
                  maxHeight: "120px",
                  fontFamily: "inherit",
                  transition: "all 0.3s ease",
                  backgroundColor: "#fafbfc",
                  lineHeight: "1.5",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.backgroundColor = "#fff";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.backgroundColor = "#fafbfc";
                  e.target.style.boxShadow = "none";
                }}
              />
              {inputValue.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "12px",
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                  }}
                >
                  {inputValue.length}/2000
                </div>
              )}
            </div>

            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isGeneratingImage}
              style={{
                padding: "16px 24px",
                borderRadius: "18px",
                border: "none",
                background:
                  inputValue.trim() && !isLoading && !isGeneratingImage
                    ? "linear-gradient(45deg, #667eea, #764ba2)"
                    : "#e5e7eb",
                color:
                  inputValue.trim() && !isLoading && !isGeneratingImage
                    ? "white"
                    : "#9ca3af",
                fontSize: "16px",
                cursor:
                  inputValue.trim() && !isLoading && !isGeneratingImage
                    ? "pointer"
                    : "not-allowed",
                boxShadow:
                  inputValue.trim() && !isLoading && !isGeneratingImage
                    ? "0 8px 25px rgba(102, 126, 234, 0.3)"
                    : "none",
                transition: "all 0.3s ease",
                fontWeight: "600",
                minWidth: "80px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => {
                if (inputValue.trim() && !isLoading && !isGeneratingImage) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 12px 35px rgba(102, 126, 234, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  inputValue.trim() && !isLoading && !isGeneratingImage
                    ? "0 8px 25px rgba(102, 126, 234, 0.3)"
                    : "none";
              }}
            >
              {isLoading || isGeneratingImage ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid currentColor",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <span style={{ fontSize: "1.2rem" }}>🚀</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "25px 20px",
          color: "white",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              Crafted with ❤️ by Vishwakarma Vaibhav
            </span>
          </div>

          <a
            href="https://www.instagram.com/bros.projects/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "25px",
              color: "white",
              textDecoration: "none",
              transition: "all 0.3s ease",
              fontSize: "0.95rem",
              fontWeight: "500",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "rgba(255,255,255,0.25)";
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "rgba(255,255,255,0.15)";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>📸</span>
            <span>Follow @bros.projects</span>
            <span style={{ fontSize: "1.1rem" }}>→</span>
          </a>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #667eea, #764ba2);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #5a67d8, #6b46c1);
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}

export default MainComponent;