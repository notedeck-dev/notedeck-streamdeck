import streamDeck from "@elgato/streamdeck";

import { RunCapability } from "./actions/capability";
import { FocusColumn } from "./actions/column";
import { OpenCompose } from "./actions/compose";
import { PostNote } from "./actions/post";
import { SwitchProfile } from "./actions/profile";
import { HideWindow, ShowWindow } from "./actions/window";

// トークンをログに残さないよう info 止まり (trace はメッセージ全文を記録する)
streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PostNote());
streamDeck.actions.registerAction(new OpenCompose());
streamDeck.actions.registerAction(new RunCapability());
streamDeck.actions.registerAction(new FocusColumn());
streamDeck.actions.registerAction(new SwitchProfile());
streamDeck.actions.registerAction(new HideWindow());
streamDeck.actions.registerAction(new ShowWindow());

streamDeck.connect();
