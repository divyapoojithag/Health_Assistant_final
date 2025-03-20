from helper import load_pdf_file, text_split, download_hugging_face_embeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not found in environment variables")

os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY

try:
    logger.info("Loading PDF files...")
    extracted_data = load_pdf_file('Data/')
    logger.info(f"Loaded {len(extracted_data)} documents")

    logger.info("Splitting text into chunks...")
    text_chunks = text_split(extracted_data)
    logger.info(f"Created {len(text_chunks)} text chunks")

    logger.info("Downloading embeddings model...")
    embeddings = download_hugging_face_embeddings()
    logger.info("Embeddings model downloaded successfully")

    logger.info("Initializing Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)

    index_name = 'medicalbot'

    # Check if index exists
    existing_indexes = pc.list_indexes()
    logger.info(f"Existing indexes: {existing_indexes}")

    if index_name not in existing_indexes:
        logger.info(f"Creating new index: {index_name}")
        pc.create_index(
            name=index_name,
            dimension=384,
            metric='cosine',
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        logger.info("Index created successfully")
    else:
        logger.info(f"Index {index_name} already exists")

    # Store embeddings in Pinecone
    logger.info("Storing embeddings in Pinecone...")
    docsearch = PineconeVectorStore.from_documents(
        documents=text_chunks,
        embedding=embeddings,
        index_name=index_name,
    )
    logger.info("Embeddings stored successfully")

except Exception as e:
    logger.error(f"Error occurred: {str(e)}")
    raise