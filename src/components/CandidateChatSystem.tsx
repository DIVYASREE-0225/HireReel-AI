import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, ChevronRight, MessageCircle } from "lucide-react";
import { io } from "socket.io-client";

interface ChatSystemProps {
  currentUserId: string;
  currentUserRole: "candidate" | "recruiter";
  currentUserName: string;
  token: string;
  initialPartnerId?: string; // Opt partner to select
}

export default function CandidateChatSystem({
  currentUserId,
  currentUserRole,
  currentUserName,
  token,
  initialPartnerId
}: ChatSystemProps) {
  const [partners, setPartners] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(initialPartnerId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const socketRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Initialize socket listener
  useEffect(() => {
    socketRef.current = io(window.location.origin);
    
    // Join private socket channel
    socketRef.current.emit("join_room", currentUserId);

    socketRef.current.on("receive_message", (data: any) => {
      // If the incoming message is from the actively selected contact, immediately play it in the chat timeline
      if (activePartnerId && String(data.senderId._id || data.senderId) === String(activePartnerId)) {
        setMessages((prev) => [...prev, data]);
      } else {
        // Refresh contacts to display notifications
        fetchPartners();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, activePartnerId]);

  // Read partner threads
  useEffect(() => {
    fetchPartners();
  }, []);

  // Sync messaging feed when active contact changes
  useEffect(() => {
    if (activePartnerId) {
      fetchMessages(activePartnerId);
    }
  }, [activePartnerId]);

  // Scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchPartners() {
    setIsLoadingPartners(true);
    try {
      const res = await fetch("/api/messages/partners/convo", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
        if (data.length > 0 && !activePartnerId) {
          setActivePartnerId(data[0].user._id);
        }
      }
    } catch (err) {
      console.error("Failed to load chat users:", err);
    } finally {
      setIsLoadingPartners(false);
    }
  }

  async function fetchMessages(partnerId: string) {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${partnerId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch message history:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activePartnerId) return;

    const messageContent = text.trim();
    setText("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: activePartnerId,
          content: messageContent
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        
        // Render in local log instantly
        setMessages((prev) => [...prev, savedMessage]);

        // Propagate in real-time over Socket.IO stream
        if (socketRef.current) {
          socketRef.current.emit("send_message", {
            ...savedMessage,
            senderName: currentUserName
          });
        }

        // Keep partner list updated
        fetchPartners();
      }
    } catch (err) {
      console.error("Message delivery failed:", err);
    }
  }

  return (
    <div id="candidate-chat-system" className="grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-805 shadow-sm overflow-hidden h-[540px] mt-4">
      
      {/* LEFT CHAT PARTNERS LIST COL */}
      <div className="md:col-span-4 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
        <div className="p-4 border-b border-slate-100/80 dark:border-slate-800 bg-white dark:bg-slate-905">
          <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Active Conversations
          </h4>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {isLoadingPartners && partners.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-20 px-4 text-slate-400 dark:text-slate-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No active recruiter message channels. Apply to jobs to initiate reviews!</p>
            </div>
          ) : (
            partners.map((partner) => {
              const isSelected = activePartnerId === partner.user._id;
              return (
                <div
                  key={partner.user._id}
                  onClick={() => setActivePartnerId(partner.user._id)}
                  className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isSelected ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                  }`}>
                    {partner.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate block">{partner.user.name}</span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"}`}>
                      {partner.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MESSAGE TIMELINE DISPLAY */}
      <div className="md:col-span-8 flex flex-col h-full justify-between bg-white dark:bg-slate-900">
        {activePartnerId ? (
          <>
            {/* Conversation Partner Banner Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/20 dark:bg-slate-950/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-150 dark:border-slate-705 text-slate-850 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                  {partners.find(p => p.user._id === activePartnerId)?.user.name.charAt(0).toUpperCase() || "R"}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-805 dark:text-white">
                    {partners.find(p => p.user._id === activePartnerId)?.user.name || "Live Recruiter Chat Channel"}
                  </h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {partners.find(p => p.user._id === activePartnerId)?.user.email || "Active Review Status Channel"}
                  </p>
                </div>
              </div>

              {partners.find(p => p.user._id === activePartnerId)?.user.kycStatus === "verified" && (
                <span className="text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full">
                  VERIFIED CANDIDATE
                </span>
              )}
            </div>

            {/* Conversation Feed */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/10 dark:bg-slate-950/5">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs">Preparing convo stream...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-550 text-xs italic">
                  No messages yet. Send a message to start conversing!
                </div>
              ) : (
                messages.map((msg, index) => {
                  const mSenderId = typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
                  const isMe = String(mSenderId) === String(currentUserId);
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-slate-900 dark:bg-indigo-650 text-slate-105 dark:text-slate-100 rounded-tr-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-705/80"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-550 font-mono mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Text Message Input Form Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 bg-white dark:bg-slate-900">
              <input
                type="text"
                value={text}
                id="inp-chat-chattext"
                onChange={(e) => setText(e.target.value)}
                placeholder="Write message..."
                className="flex-1 px-4 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-905 dark:text-white rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-650"
              />
              <button
                type="submit"
                id="btn-chat-send"
                className="bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600/80 text-white rounded-xl py-2 px-4 shadow transition cursor-pointer flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-32 text-slate-400 dark:text-slate-500 flex flex-col justify-center items-center gap-3">
            <MessageSquare className="w-10 h-10 text-indigo-50/80 dark:text-indigo-950/40 animate-pulse" />
            <div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-white">No Dialogue Channels Opened</h5>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 max-w-[240px]">
                Connect directly with hiring managers. Once you apply, recruiters can message you directly here.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
