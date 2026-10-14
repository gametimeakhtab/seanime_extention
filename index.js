/// <reference path="../../internal/extension_repo/goja_plugin_types/plugin.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/app.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/core.d.ts" />

function init() {
    console.log("[Watch-History-Manager] Plugin initialized");

    // Cache anime collection whenever Seanime loads it to enrich history items with anime titles & covers
    $app.onGetAnimeCollection(function(e) {
        if (e.animeCollection) {
            $store.set("latestAnimeCollection", $clone(e.animeCollection));
        }
        e.next();
    });

    $ui.register(function(ctx) {
        console.log("[Watch-History-Manager] Registering UI components and context menu actions");

        // Helper: format seconds into MM:SS or HH:MM:SS
        function formatDuration(sec) {
            if (!sec || isNaN(sec) || sec < 0) return "0:00";
            var totalSeconds = Math.floor(sec);
            var hours = Math.floor(totalSeconds / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;
            var sSec = seconds < 10 ? "0" + seconds : "" + seconds;
            if (hours > 0) {
                var sMin = minutes < 10 ? "0" + minutes : "" + minutes;
                return hours + ":" + sMin + ":" + sSec;
            }
            return minutes + ":" + sSec;
        }

        // Helper: format relative timestamp (e.g. "5m ago", "2h ago", "1d ago")
        function formatRelativeTime(dateStr) {
            if (!dateStr) return "";
            var date = new Date(dateStr);
            var now = new Date();
            var diffMs = now.getTime() - date.getTime();
            if (isNaN(diffMs) || diffMs < 0) return "Just now";
            var diffMin = Math.floor(diffMs / 60000);
            if (diffMin < 1) return "Just now";
            if (diffMin < 60) return diffMin + "m ago";
            var diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24) return diffHours + "h ago";
            var diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return diffDays + "d ago";
            return date.toLocaleDateString();
        }

        // Helper: lookup anime metadata from cached AniList collection
        function getAnimeMetadata(mediaId) {
            try {
                var collection = $store.get("latestAnimeCollection");
                if (collection && collection.lists) {
                    for (var i = 0; i < collection.lists.length; i++) {
                        var list = collection.lists[i];
                        if (list && list.entries) {
                            for (var j = 0; j < list.entries.length; j++) {
                                var entry = list.entries[j];
                                if (entry && entry.media && entry.media.id === mediaId) {
                                    var title = (entry.media.title && (entry.media.title.userPreferred || entry.media.title.romaji || entry.media.title.english)) || "";
                                    var cover = (entry.media.coverImage && (entry.media.coverImage.large || entry.media.coverImage.medium)) || "";
                                    return { title: title, cover: cover, totalEpisodes: entry.media.episodes || 0 };
                                }
                            }
                        }
                    }
                }
            } catch (_) {}
            return { title: "", cover: "", totalEpisodes: 0 };
        }

        // =========================================================================
        // 1. RIGHT-CLICK CONTEXT MENU ACTIONS (Mark as Watched)
        // =========================================================================

        // --- Action A: Episode Card Right-Click Menu: "Mark Episode as Watched" ---
        var markEpisodeAction = ctx.action.newEpisodeCardContextMenuItem({
            label: "Mark Episode as Watched"
        });
        markEpisodeAction.mount();
        markEpisodeAction.onClick(function(event) {
            try {
                var ep = event && event.episode;
                if (!ep) {
                    ctx.toast.error("Episode data not found");
                    return;
                }
                var mediaId = (ep.baseAnime && ep.baseAnime.id) || (ep.localFile && ep.localFile.mediaId) || ep.mediaId;
                var epNum = ep.progressNumber || ep.episodeNumber;

                if (!mediaId) {
                    ctx.toast.error("Could not determine anime ID for this episode");
                    return;
                }
                if (!epNum && epNum !== 0) {
                    ctx.toast.error("Could not determine episode number");
                    return;
                }

                $anilist.updateEntryProgress(mediaId, epNum);
                ctx.toast.success("Marked Episode " + epNum + " as watched on AniList!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark episode as watched: " + msg);
            }
        });

        // --- Action B: Media Card Right-Click Menu: "Mark Next Episode as Watched" ---
        var markNextEpisodeAction = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Next Episode as Watched",
            for: "anime"
        });
        markNextEpisodeAction.mount();
        markNextEpisodeAction.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Media data not found");
                    return;
                }
                var currentProgress = media.progress || 0;
                var nextEp = currentProgress + 1;
                var totalEp = media.episodes || null;

                if (totalEp && nextEp > totalEp) {
                    ctx.toast.info("All " + totalEp + " episodes are already marked as watched!");
                    return;
                }

                $anilist.updateEntryProgress(media.id, nextEp, totalEp);
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || ("Anime #" + media.id);
                ctx.toast.success("Updated " + title + ": Episode " + nextEp + " watched!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update progress: " + msg);
            }
        });

        // --- Action C: Media Card Right-Click Menu: "Mark Anime as Completed" ---
        var markCompletedAction = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Anime as Completed",
            for: "anime"
        });
        markCompletedAction.mount();
        markCompletedAction.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Media data not found");
                    return;
                }
                var targetEpisodes = media.episodes || (media.progress ? media.progress + 1 : 1);
                $anilist.updateEntryProgress(media.id, targetEpisodes, targetEpisodes);
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || ("Anime #" + media.id);
                ctx.toast.success("Marked " + title + " as Completed (" + targetEpisodes + " eps)!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark as completed: " + msg);
            }
        });

        // =========================================================================
        // 2. WATCHING HISTORY IN CHRONOLOGICAL ORDER (Tray Drawer)
        // =========================================================================

        var tray = ctx.tray.newTray({
            tooltipText: "Watching History (Chronological)",
            isDrawer: true,
            width: "440px"
        });

        // Whenever the drawer opens, refresh the tray
        tray.onOpen(function() {
            tray.update();
        });

        // Render the drawer contents
        tray.render(function() {
            // 1. Fetch raw watch history from continuity manager
            var rawHistory = {};
            try {
                if (ctx.continuity && typeof ctx.continuity.getWatchHistory === "function") {
                    rawHistory = ctx.continuity.getWatchHistory() || {};
                }
            } catch (e) {
                console.error("[Watch-History-Manager] Error fetching watch history:", e);
            }

            // 2. Convert map to array
            var items = [];
            for (var key in rawHistory) {
                if (Object.prototype.hasOwnProperty.call(rawHistory, key)) {
                    var item = rawHistory[key];
                    if (item && item.mediaId) {
                        items.push(item);
                    }
                }
            }

            // 3. Sort strictly in order of watching (most recently updated/watched first)
            items.sort(function(a, b) {
                var timeA = new Date(a.timeUpdated || a.timeAdded || 0).getTime();
                var timeB = new Date(b.timeUpdated || b.timeAdded || 0).getTime();
                return timeB - timeA;
            });

            // If empty, display friendly state
            if (items.length === 0) {
                return [
                    tray.stack({
                        gap: 4,
                        className: "p-6 text-center space-y-4",
                        items: [
                            tray.text({
                                text: "Watching History",
                                className: "text-lg font-bold text-white tracking-wide"
                            }),
                            tray.text({
                                text: "No watch history recorded yet.\nStart watching an episode and your chronological history will appear here in real time!",
                                className: "text-sm text-gray-400 whitespace-pre-line leading-relaxed"
                            }),
                            tray.button({
                                label: "Refresh",
                                size: "sm",
                                intent: "primary",
                                onClick: ctx.eventHandler("refresh-empty-history", function() {
                                    tray.update();
                                })
                            })
                        ]
                    })
                ];
            }

            // Build history card components
            var itemCards = [];

            // Header summary bar
            itemCards.push(
                tray.flex({
                    direction: "row",
                    className: "items-center justify-between pb-3 border-b border-gray-800/80 mb-2",
                    items: [
                        tray.stack({
                            gap: 0,
                            items: [
                                tray.text({
                                    text: "Watching History (" + items.length + ")",
                                    className: "text-base font-bold text-white tracking-wide"
                                }),
                                tray.text({
                                    text: "In chronological order (Latest watched first)",
                                    className: "text-xs text-gray-400"
                                })
                            ]
                        }),
                        tray.button({
                            label: "Refresh",
                            size: "xs",
                            intent: "gray-subtle",
                            onClick: ctx.eventHandler("refresh-history-list", function() {
                                tray.update();
                            })
                        })
                    ]
                })
            );

            // Render each history item
            for (var idx = 0; idx < items.length; idx++) {
                (function(historyItem) {
                    var mId = historyItem.mediaId;
                    var epNum = historyItem.episodeNumber || 1;
                    var currTime = historyItem.currentTime || 0;
                    var duration = historyItem.duration || 0;
                    var timeStr = formatDuration(currTime) + " / " + formatDuration(duration);
                    var percent = (duration > 0) ? Math.min(100, Math.round((currTime / duration) * 100)) : 0;
                    var relativeTime = formatRelativeTime(historyItem.timeUpdated || historyItem.timeAdded);

                    // Metadata lookup for title
                    var meta = getAnimeMetadata(mId);
                    var displayTitle = meta.title;
                    if (!displayTitle) {
                        if (historyItem.filepath) {
                            var parts = historyItem.filepath.split(/[/\\]/);
                            displayTitle = parts[parts.length - 1];
                        } else {
                            displayTitle = "Anime #" + mId;
                        }
                    }

                    itemCards.push(
                        tray.div({
                            className: "p-3 rounded-xl bg-gray-900/60 border border-gray-800/90 hover:border-gray-700/80 transition-all space-y-2 mb-3 shadow-sm",
                            items: [
                                // Top row: Title and relative time
                                tray.flex({
                                    direction: "row",
                                    className: "items-start justify-between gap-2",
                                    items: [
                                        tray.stack({
                                            gap: 0,
                                            className: "flex-1 min-w-0",
                                            items: [
                                                tray.text({
                                                    text: displayTitle,
                                                    className: "text-sm font-semibold text-white truncate"
                                                }),
                                                tray.flex({
                                                    direction: "row",
                                                    className: "items-center gap-2 mt-0.5",
                                                    items: [
                                                        tray.badge({
                                                            text: "EP " + epNum,
                                                            intent: "primary"
                                                        }),
                                                        tray.text({
                                                            text: timeStr + " (" + percent + "%)",
                                                            className: "text-xs text-gray-400"
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        tray.text({
                                            text: relativeTime,
                                            className: "text-xs text-gray-400 flex-none"
                                        })
                                    ]
                                }),

                                // Progress bar
                                tray.div({
                                    className: "w-full bg-gray-800/90 rounded-full h-1.5 overflow-hidden",
                                    items: [
                                        tray.div({
                                            className: "bg-brand-500 h-1.5 rounded-full transition-all duration-300",
                                            style: { width: percent + "%" }
                                        })
                                    ]
                                }),

                                // Action Buttons row
                                tray.flex({
                                    direction: "row",
                                    className: "items-center justify-end gap-2 pt-1",
                                    items: [
                                        // "Mark as Watched" button
                                        tray.button({
                                            label: "Mark Watched",
                                            size: "xs",
                                            intent: "primary",
                                            onClick: ctx.eventHandler("history-mark-watched-" + mId + "-" + epNum, function() {
                                                try {
                                                    $anilist.updateEntryProgress(mId, epNum, meta.totalEpisodes || null);
                                                    ctx.toast.success("Marked Episode " + epNum + " as watched on AniList!");
                                                    tray.update();
                                                } catch (err) {
                                                    var msg = (err && err.message) ? err.message : String(err);
                                                    ctx.toast.error("Failed to mark as watched: " + msg);
                                                }
                                            })
                                        }),

                                        // "Go to Anime" page button
                                        tray.button({
                                            label: "Go to Anime",
                                            size: "xs",
                                            intent: "gray-subtle",
                                            onClick: ctx.eventHandler("history-open-anime-" + mId, function() {
                                                ctx.screen.navigateTo("/entry?id=" + mId);
                                            })
                                        }),

                                        // "Remove" item from history
                                        tray.button({
                                            label: "Remove",
                                            size: "xs",
                                            intent: "alert-subtle",
                                            onClick: ctx.eventHandler("history-remove-" + mId, function() {
                                                try {
                                                    ctx.continuity.deleteWatchHistoryItem(mId);
                                                    ctx.toast.info("Removed from watch history.");
                                                    tray.update();
                                                } catch (err) {
                                                    var msg = (err && err.message) ? err.message : String(err);
                                                    ctx.toast.error("Failed to remove item: " + msg);
                                                }
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    );
                })(items[idx]);
            }

            return [
                tray.stack({
                    gap: 1,
                    className: "p-4 space-y-1 overflow-y-auto max-h-[88vh]",
                    items: itemCards
                })
            ];
        });
    });
}
