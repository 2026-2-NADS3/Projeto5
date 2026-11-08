import type { DataProvider } from "@refinedev/core";
import { supabaseDataProvider } from "./supabase/supabaseDataProvider";

/**
 * Data provider usado pelo painel: lê e grava SÓ no banco do Supabase
 * (src/providers/supabase/supabaseDataProvider.ts).
 *
 * O mock (src/mocks/) continua no projeto apenas para os testes automatizados.
 */
export const dataProvider: DataProvider = supabaseDataProvider;
