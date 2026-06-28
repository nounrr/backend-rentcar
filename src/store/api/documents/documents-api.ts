import { baseApi } from "@/store/api/base-api"
import type {
  CreateTemplateRequest,
  CreateTemplateResponse,
  DocumentId,
  DocumentTemplate,
  DocumentType,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  GeneratedDocument,
  TemplateId,
  UpdateTemplateRequest,
  UpdateTemplateResponse,
} from "./types"

const TEMPLATES_TAG = { type: "Documents" as const, id: "LIST" }

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTemplates: builder.query<DocumentTemplate[], { type?: DocumentType } | void>({
      query: (params) => {
        const sp = new URLSearchParams()
        if (params?.type) sp.set("type", params.type)
        const qs = sp.toString()
        return `/admin/document-templates${qs ? `?${qs}` : ""}`
      },
      providesTags: [TEMPLATES_TAG],
    }),

    getTemplate: builder.query<DocumentTemplate, TemplateId>({
      query: (id) => `/admin/document-templates/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Documents" as const, id }],
    }),

    createTemplate: builder.mutation<CreateTemplateResponse, CreateTemplateRequest>({
      query: (body) => ({ url: "/admin/document-templates", method: "POST", body }),
      invalidatesTags: [TEMPLATES_TAG],
    }),

    updateTemplate: builder.mutation<UpdateTemplateResponse, { id: TemplateId } & UpdateTemplateRequest>({
      query: ({ id, ...body }) => ({ url: `/admin/document-templates/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [TEMPLATES_TAG, { type: "Documents" as const, id }],
    }),

    deleteTemplate: builder.mutation<{ message: string }, TemplateId>({
      query: (id) => ({ url: `/admin/document-templates/${id}`, method: "DELETE" }),
      invalidatesTags: [TEMPLATES_TAG],
    }),

    generateDocument: builder.mutation<GenerateDocumentResponse, { templateId: TemplateId } & GenerateDocumentRequest>({
      query: ({ templateId, ...body }) => ({
        url: `/admin/document-templates/${templateId}/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Documents" as const, id: "GENERATED" }],
    }),

    getGeneratedDocuments: builder.query<GeneratedDocument[], { type?: DocumentType } | void>({
      query: (params) => {
        const sp = new URLSearchParams()
        if (params?.type) sp.set("type", params.type)
        const qs = sp.toString()
        return `/admin/generated-documents${qs ? `?${qs}` : ""}`
      },
      providesTags: [{ type: "Documents" as const, id: "GENERATED" }],
    }),

    deleteGeneratedDocument: builder.mutation<{ message: string }, DocumentId>({
      query: (id) => ({ url: `/admin/generated-documents/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Documents" as const, id: "GENERATED" }],
    }),
  }),
})

export const {
  useGetTemplatesQuery,
  useGetTemplateQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGenerateDocumentMutation,
  useGetGeneratedDocumentsQuery,
  useDeleteGeneratedDocumentMutation,
} = documentsApi
